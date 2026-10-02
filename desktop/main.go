//go:build windows

// PAFTA — koordinatlardan ölçekli harita. Kurulumsuz, tek dosyalık Windows uygulaması.
// Arayüz Windows 10/11'de hazır gelen Edge WebView2 motoruyla gösterilir;
// tarayıcı açılmaz, internet gerekmez, yönetici yetkisi gerekmez.
package main

import (
	"crypto/rand"
	_ "embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"unicode/utf16"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
	"golang.org/x/sys/windows"
)

//go:embed app.html
var appHTML []byte

//go:embed shim.js
var shimJS string

const uygAdi = "PAFTA"

/* Arayüzün koyu rengi (#0e1a21) ve araç şeridi rengi (#0a141a): başlık çubuğu ve açılış zemini bunlarla boyanır */
const (
	renkZemin   = 0x00211A0E // COLORREF (0x00BBGGRR) — #0e1a21
	renkSerit   = 0x001A140A // #0a141a
	renkBaslik  = 0x00E9E6DC // #dce6e9
	webviewZemin = "FF0E1A21" // ARGB
)

var (
	comdlg32            = windows.NewLazySystemDLL("comdlg32.dll")
	pGetSaveFileName    = comdlg32.NewProc("GetSaveFileNameW")
	pGetOpenFileName    = comdlg32.NewProc("GetOpenFileNameW")
	user32              = windows.NewLazySystemDLL("user32.dll")
	pMessageBox         = user32.NewProc("MessageBoxW")
	pSetWindowLongPtr   = user32.NewProc("SetWindowLongPtrW")
	pSetClassLongPtr    = user32.NewProc("SetClassLongPtrW")
	pCallWindowProc     = user32.NewProc("CallWindowProcW")
	pPostMessage        = user32.NewProc("PostMessageW")
	pShowWindow         = user32.NewProc("ShowWindow")
	pLoadImage          = user32.NewProc("LoadImageW")
	pSendMessage        = user32.NewProc("SendMessageW")
	pGetWindowPlacement = user32.NewProc("GetWindowPlacement")
	pSetWindowPlacement = user32.NewProc("SetWindowPlacement")
	pMonitorFromRect    = user32.NewProc("MonitorFromRect")
	pInvalidateRect     = user32.NewProc("InvalidateRect")
	gdi32               = windows.NewLazySystemDLL("gdi32.dll")
	pCreateSolidBrush   = gdi32.NewProc("CreateSolidBrush")
	dwmapi              = windows.NewLazySystemDLL("dwmapi.dll")
	pDwmSetAttr         = dwmapi.NewProc("DwmSetWindowAttribute")
	kernel32            = windows.NewLazySystemDLL("kernel32.dll")
	pGetModuleHandle    = kernel32.NewProc("GetModuleHandleW")
)

const (
	wmClose         = 0x0010
	wmSetIcon       = 0x0080
	gwlpWndProc     = ^uintptr(3) // -4
	gclpHbrBackgrnd = ^uintptr(9) // -10
	swShowNormal    = 1
	swMaximize      = 3
	mbOk            = 0x0
	mbOkCancel      = 0x1
	mbYesNoCancel   = 0x3
	mbIconError     = 0x10
	mbIconQuest     = 0x20
	mbIconWarn      = 0x30
	mbIconInfo      = 0x40
	mbSetFg         = 0x10000
	idOk            = 1
	idCancel        = 2
	idYes           = 6
	idNo            = 7
)

/* ---------------- dosya pencereleri ---------------- */

type openFileName struct {
	lStructSize       uint32
	hwndOwner         uintptr
	hInstance         uintptr
	lpstrFilter       *uint16
	lpstrCustomFilter *uint16
	nMaxCustFilter    uint32
	nFilterIndex      uint32
	lpstrFile         *uint16
	nMaxFile          uint32
	lpstrFileTitle    *uint16
	nMaxFileTitle     uint32
	lpstrInitialDir   *uint16
	lpstrTitle        *uint16
	Flags             uint32
	nFileOffset       uint16
	nFileExtension    uint16
	lpstrDefExt       *uint16
	lCustData         uintptr
	lpfnHook          uintptr
	lpTemplateName    *uint16
	pvReserved        uintptr
	dwReserved        uint32
	FlagsEx           uint32
}

const (
	ofnOverwritePrompt = 0x2
	ofnNoChangeDir     = 0x8
	ofnPathMustExist   = 0x800
	ofnFileMustExist   = 0x1000
	ofnExplorer        = 0x80000
)

func filterUTF16(f string) *uint16 {
	if f == "" {
		f = "Tüm dosyalar (*.*)|*.*"
	}
	u := utf16.Encode([]rune(strings.ReplaceAll(f, "|", "\x00") + "\x00\x00"))
	return &u[0]
}

func strPtr(s string) *uint16 {
	if s == "" {
		return nil
	}
	p, _ := windows.UTF16PtrFromString(s)
	return p
}

func defExtOf(filter string) string {
	parts := strings.Split(filter, "|")
	if len(parts) >= 2 {
		e := strings.TrimPrefix(strings.Split(parts[1], ";")[0], "*.")
		if e != "*" {
			return e
		}
	}
	return ""
}

func fileDialog(owner uintptr, save bool, title, defName, filter string) string {
	buf := make([]uint16, 8192)
	dir := sonKlasor()
	if defName != "" {
		if filepath.IsAbs(defName) {
			dir = filepath.Dir(defName)
			defName = filepath.Base(defName)
		}
		copy(buf, utf16.Encode([]rune(defName)))
	}
	ofn := openFileName{
		hwndOwner:       owner,
		lpstrFilter:     filterUTF16(filter),
		nFilterIndex:    1,
		lpstrFile:       &buf[0],
		nMaxFile:        uint32(len(buf)),
		lpstrInitialDir: strPtr(dir),
		lpstrTitle:      strPtr(title),
		lpstrDefExt:     strPtr(defExtOf(filter)),
		Flags:           ofnExplorer | ofnNoChangeDir | ofnPathMustExist,
	}
	ofn.lStructSize = uint32(unsafe.Sizeof(ofn))
	var r uintptr
	if save {
		ofn.Flags |= ofnOverwritePrompt
		r, _, _ = pGetSaveFileName.Call(uintptr(unsafe.Pointer(&ofn)))
	} else {
		ofn.Flags |= ofnFileMustExist
		r, _, _ = pGetOpenFileName.Call(uintptr(unsafe.Pointer(&ofn)))
	}
	runtime.KeepAlive(buf)
	if r == 0 {
		return ""
	}
	p := windows.UTF16ToString(buf)
	st := loadState()
	st.LastDir = filepath.Dir(p)
	saveState(st)
	return p
}

func msgBox(owner uintptr, text, caption string, flags uintptr) int {
	if caption == "" {
		caption = uygAdi
	}
	r, _, _ := pMessageBox.Call(owner, uintptr(unsafe.Pointer(strPtr(text))), uintptr(unsafe.Pointer(strPtr(caption))), flags|mbSetFg)
	return int(r)
}

/* ---------------- kalıcı durum (%LOCALAPPDATA%\PAFTA) ---------------- */

type yerlesim struct {
	Buyuk bool  `json:"buyuk"`
	Sol   int32 `json:"sol"`
	Ust   int32 `json:"ust"`
	Sag   int32 `json:"sag"`
	Alt   int32 `json:"alt"`
}

type appState struct {
	LastDir string    `json:"lastDir"`
	Recent  []string  `json:"recent"`
	Pencere *yerlesim `json:"pencere,omitempty"`
}

var stateMu sync.Mutex

func appDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	d := filepath.Join(base, "PAFTA")
	os.MkdirAll(d, 0o755)
	return d
}

func loadState() appState {
	stateMu.Lock()
	defer stateMu.Unlock()
	var s appState
	if b, err := os.ReadFile(filepath.Join(appDir(), "ayarlar.json")); err == nil {
		json.Unmarshal(b, &s)
	}
	return s
}

func saveState(s appState) {
	stateMu.Lock()
	defer stateMu.Unlock()
	b, _ := json.MarshalIndent(s, "", " ")
	writeAtomic(filepath.Join(appDir(), "ayarlar.json"), b)
}

func sonKlasor() string {
	if d := loadState().LastDir; d != "" {
		if fi, err := os.Stat(d); err == nil && fi.IsDir() {
			return d
		}
	}
	if h, err := os.UserHomeDir(); err == nil {
		return filepath.Join(h, "Documents")
	}
	return ""
}

func sonAcilanEkle(p string) {
	st := loadState()
	l := []string{p}
	for _, x := range st.Recent {
		if !strings.EqualFold(x, p) {
			l = append(l, x)
		}
	}
	if len(l) > 8 {
		l = l[:8]
	}
	st.Recent = l
	st.LastDir = filepath.Dir(p)
	saveState(st)
}

func writeAtomic(path string, data []byte) error {
	tmp := path + ".tmp~"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		os.Remove(tmp)
		return os.WriteFile(path, data, 0o644)
	}
	return nil
}

/* ---------------- pencere görünümü ---------------- */

type point struct{ X, Y int32 }
type rect struct{ L, T, R, B int32 }
type windowPlacement struct {
	Length    uint32
	Flags     uint32
	ShowCmd   uint32
	MinPos    point
	MaxPos    point
	NormalPos rect
	Device    rect
}

/* Koyu başlık çubuğu: Windows 10 (20H1+) koyu tema, Windows 11'de araç şeridiyle aynı renk */
func koyuBaslik(hwnd uintptr) {
	if pDwmSetAttr.Find() != nil {
		return
	}
	set := func(attr uintptr, v uint32) {
		pDwmSetAttr.Call(hwnd, attr, uintptr(unsafe.Pointer(&v)), 4)
	}
	set(20, 1) // DWMWA_USE_IMMERSIVE_DARK_MODE
	set(19, 1) // eski Windows 10 sürümleri
	set(35, renkSerit)  // DWMWA_CAPTION_COLOR (Windows 11)
	set(34, renkSerit)  // DWMWA_BORDER_COLOR
	set(36, renkBaslik) // DWMWA_TEXT_COLOR
}

/* WebView hazır olana kadar pencerenin beyaz parlamaması için sınıf zemini koyu */
func koyuZemin(hwnd uintptr) {
	if br, _, _ := pCreateSolidBrush.Call(renkZemin); br != 0 {
		pSetClassLongPtr.Call(hwnd, gclpHbrBackgrnd, br)
		pInvalidateRect.Call(hwnd, 0, 1)
	}
}

func yerlesimKaydet(hwnd uintptr) {
	wp := windowPlacement{}
	wp.Length = uint32(unsafe.Sizeof(wp))
	if r, _, _ := pGetWindowPlacement.Call(hwnd, uintptr(unsafe.Pointer(&wp))); r == 0 {
		return
	}
	st := loadState()
	st.Pencere = &yerlesim{Buyuk: wp.ShowCmd == swMaximize, Sol: wp.NormalPos.L, Ust: wp.NormalPos.T, Sag: wp.NormalPos.R, Alt: wp.NormalPos.B}
	saveState(st)
}

/* Son kapanıştaki boyut ve konum; ekran artık yoksa (ör. ikinci monitör çıkarıldı) tam ekran açılır */
func yerlesimUygula(hwnd uintptr) {
	y := loadState().Pencere
	if y != nil && y.Sag-y.Sol >= 640 && y.Alt-y.Ust >= 420 {
		rc := rect{y.Sol, y.Ust, y.Sag, y.Alt}
		if m, _, _ := pMonitorFromRect.Call(uintptr(unsafe.Pointer(&rc)), 0); m != 0 {
			wp := windowPlacement{ShowCmd: swShowNormal, NormalPos: rc}
			wp.Length = uint32(unsafe.Sizeof(wp))
			if y.Buyuk {
				wp.ShowCmd = swMaximize
			}
			pSetWindowPlacement.Call(hwnd, uintptr(unsafe.Pointer(&wp)))
			return
		}
	}
	pShowWindow.Call(hwnd, swMaximize)
}

/* ---------------- pencere yordamı: kaydedilmemiş değişiklikte kapatma ---------------- */

var hwndAna uintptr
var wv webview2.WebView
var eskiProc uintptr
var kirli, kapanabilir bool

func yeniProc(hwnd, msg, wp, lp uintptr) uintptr {
	if msg == wmClose {
		if kirli && !kapanabilir {
			wv.Eval("window.__menu && window.__menu('kapatma-istegi')")
			return 0
		}
		yerlesimKaydet(hwnd)
	}
	r, _, _ := pCallWindowProc.Call(eskiProc, hwnd, msg, wp, lp)
	return r
}

/* ---------------- arayüzle iletişim ---------------- */

type dosyaSonucu struct {
	Yol    string `json:"yol,omitempty"`
	Ad     string `json:"ad,omitempty"`
	Icerik string `json:"icerik,omitempty"`
	B64    string `json:"b64,omitempty"`
	Hata   string `json:"hata,omitempty"`
}

func oku(p string, ikili bool) dosyaSonucu {
	b, err := os.ReadFile(p)
	if err != nil {
		return dosyaSonucu{Hata: err.Error()}
	}
	r := dosyaSonucu{Yol: p, Ad: filepath.Base(p)}
	if ikili {
		r.B64 = base64.StdEncoding.EncodeToString(b)
	} else {
		r.Icerik = string(b)
	}
	return r
}

func geriCagir(id int, v interface{}) {
	js, _ := json.Marshal(v)
	b, _ := json.Marshal(id)
	wv.Eval("window.__ncb(" + string(b) + "," + string(js) + ")")
}

type sonDosya struct {
	Yol    string `json:"yol"`
	Ad     string `json:"ad"`
	Klasor string `json:"klasor"`
}

func baglantilar(w webview2.WebView) {
	w.Bind("nativeBaslangic", func() interface{} {
		for _, a := range os.Args[1:] {
			if strings.HasPrefix(a, "-") {
				continue
			}
			p, _ := filepath.Abs(a)
			if strings.HasSuffix(strings.ToLower(p), ".pafta") {
				if r := oku(p, false); r.Hata == "" {
					sonAcilanEkle(p)
					return r
				}
			}
		}
		return nil
	})
	/* Dosya pencereleri olay işleyicisi içinde değil, ana döngüde açılır; sonuç window.__ncb ile döner */
	w.Bind("nativeDiyalog", func(id int, tur, baslik, ad, filtre string) {
		w.Dispatch(func() {
			var res interface{}
			switch tur {
			case "ac":
				if p := fileDialog(hwndAna, false, baslik, "", filtre); p != "" {
					if r := oku(p, false); r.Hata != "" {
						msgBox(hwndAna, "Dosya açılamadı:\n"+p+"\n\n"+r.Hata, "", mbIconError)
					} else {
						sonAcilanEkle(p)
						res = r
					}
				}
			case "kaydetYeri":
				if p := fileDialog(hwndAna, true, baslik, ad, filtre); p != "" {
					res = p
				}
			}
			geriCagir(id, res)
		})
	})
	/* Yedek: arayüz soruları kendi penceresinde sorar; bu yalnızca eski çağrılar için */
	w.Bind("nativeSoru", func(id int, mesaj, detay, dugmeler string, tur string) {
		w.Dispatch(func() {
			ikon := uintptr(mbIconQuest)
			switch tur {
			case "warning":
				ikon = mbIconWarn
			case "error":
				ikon = mbIconError
			case "info":
				ikon = mbIconInfo
			}
			metin := mesaj
			if detay != "" {
				metin += "\n\n" + detay
			}
			n := len(strings.Split(dugmeler, "|"))
			sonuc := 0
			switch {
			case n >= 3:
				sonuc = map[int]int{idYes: 0, idNo: 1, idCancel: 2}[msgBox(hwndAna, metin, "", mbYesNoCancel|ikon)]
			case n == 2:
				if msgBox(hwndAna, metin, "", mbOkCancel|ikon) != idOk {
					sonuc = 1
				}
			default:
				msgBox(hwndAna, metin, "", mbOk|ikon)
			}
			geriCagir(id, sonuc)
		})
	})
	w.Bind("nativeOku", func(p string) interface{} {
		r := oku(p, false)
		if r.Hata != "" {
			w.Dispatch(func() { msgBox(hwndAna, "Dosya açılamadı:\n"+p+"\n\n"+r.Hata, "", mbIconError) })
			return nil
		}
		sonAcilanEkle(p)
		return r
	})
	w.Bind("nativeYaz", func(p, veri string, ikili, proje bool) map[string]interface{} {
		var b []byte
		var err error
		if ikili {
			b, err = base64.StdEncoding.DecodeString(veri)
		} else {
			b = []byte(veri)
		}
		if err == nil {
			err = writeAtomic(p, b)
		}
		if err != nil {
			hata := err.Error()
			w.Dispatch(func() {
				msgBox(hwndAna, "Kaydedilemedi:\n"+p+"\n\n"+hata+
					"\n\nKlasöre yazma izniniz olduğundan ve dosyanın başka bir programda açık olmadığından emin olun.", "", mbIconError)
			})
			return map[string]interface{}{"ok": false}
		}
		if proje {
			sonAcilanEkle(p)
		} else {
			st := loadState()
			st.LastDir = filepath.Dir(p)
			saveState(st)
		}
		return map[string]interface{}{"ok": true, "ad": filepath.Base(p)}
	})
	w.Bind("nativeSonAcilanlar", func() []sonDosya {
		l := []sonDosya{}
		for _, p := range loadState().Recent {
			if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
				l = append(l, sonDosya{Yol: p, Ad: filepath.Base(p), Klasor: filepath.Dir(p)})
			}
		}
		return l
	})
	w.Bind("nativeSonTemizle", func() bool {
		st := loadState()
		st.Recent = nil
		saveState(st)
		return true
	})
	w.Bind("nativeVeriKlasoru", func() string { return appDir() })
	w.Bind("nativeKurtarmaYaz", func(veri string) {
		writeAtomic(filepath.Join(appDir(), "kurtarma.pafta"), []byte(veri))
	})
	w.Bind("nativeKurtarmaOku", func() string {
		b, err := os.ReadFile(filepath.Join(appDir(), "kurtarma.pafta"))
		if err != nil {
			return ""
		}
		return string(b)
	})
	w.Bind("nativeKurtarmaSil", func() { os.Remove(filepath.Join(appDir(), "kurtarma.pafta")) })
	w.Bind("nativeKirli", func(d bool, baslik string) {
		kirli = d
		w.Dispatch(func() { w.SetTitle(baslik) })
	})
	w.Bind("nativeKapat", func() {
		kapanabilir = true
		pPostMessage.Call(hwndAna, wmClose, 0, 0)
	})
	w.Bind("nativeKonum", func(p string) {
		if _, err := os.Stat(p); err == nil {
			exec.Command("explorer", "/select,", p).Start()
		}
	})
}

func main() {
	runtime.LockOSThread()

	/* Türkçe arayüz metinleri; açılışta beyaz yerine uygulamanın koyu zemini */
	os.Setenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--lang=tr --disable-features=msSmartScreenProtection")
	os.Setenv("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", webviewZemin)

	/* Uygulama yalnızca bu bilgisayardan erişilebilen yerel bir adresten sunulur */
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		msgBox(0, "Yerel sunucu başlatılamadı: "+err.Error(), "", mbIconError)
		return
	}
	tb := make([]byte, 12)
	rand.Read(tb)
	jeton := hex.EncodeToString(tb)
	mux := http.NewServeMux()
	mux.HandleFunc("/"+jeton+"/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(appHTML)
	})
	/* alert / confirm: senkron istek, uygulama adlı Windows mesaj kutusu */
	mux.HandleFunc("/"+jeton+"/__mesaj", func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if r.URL.Query().Get("k") == "confirm" {
			if msgBox(hwndAna, string(b), "", mbOkCancel|mbIconQuest) == idOk {
				w.Write([]byte("1"))
			} else {
				w.Write([]byte("0"))
			}
			return
		}
		msgBox(hwndAna, string(b), "", mbOk|mbIconInfo)
		w.Write([]byte("1"))
	})
	go http.Serve(ln, mux)

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		DataPath:  filepath.Join(appDir(), "WebView2"),
		WindowOptions: webview2.WindowOptions{
			Title:  "Adsız pafta — " + uygAdi,
			Width:  1440,
			Height: 900,
			Center: true,
			IconId: 1,
		},
	})
	if w == nil {
		msgBox(0, "Microsoft Edge WebView2 bileşeni bu bilgisayarda bulunamadı.\n\n"+
			"Windows 10 ve 11'de normalde hazır gelir. Bulunamıyorsa uygulamanın HTML sürümünü "+
			"(pafta.html) Edge veya Chrome ile açarak aynı şekilde kullanabilirsiniz.", "", mbIconError)
		return
	}
	defer w.Destroy()
	wv = w
	hwndAna = uintptr(w.Window())
	w.SetSize(1000, 640, webview2.HintMin)

	koyuBaslik(hwndAna)
	koyuZemin(hwndAna)

	/* görev çubuğu ve başlık ikonu */
	if hInst, _, _ := pGetModuleHandle.Call(0); hInst != 0 {
		if hb, _, _ := pLoadImage.Call(hInst, 1, 1, 32, 32, 0); hb != 0 {
			pSendMessage.Call(hwndAna, wmSetIcon, 1, hb)
		}
		if hk, _, _ := pLoadImage.Call(hInst, 1, 1, 16, 16, 0); hk != 0 {
			pSendMessage.Call(hwndAna, wmSetIcon, 0, hk)
		}
	}

	/* pencere yordamını sar: kaydedilmemiş değişiklikte kapatma sorusu ve pencere konumu */
	eskiProc, _, _ = pSetWindowLongPtr.Call(hwndAna, gwlpWndProc, syscall.NewCallback(yeniProc))
	yerlesimUygula(hwndAna)

	baglantilar(w)
	w.Init(shimJS)
	w.Navigate("http://" + ln.Addr().String() + "/" + jeton + "/")
	w.Run()
}
