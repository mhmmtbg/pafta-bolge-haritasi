package main

// Uydu paketi (.paftauydu): internete bağlı bir bilgisayarda tools/uydu_paketi.py ile hazırlanan,
// tek dosyalık döşeme arşivi. Biçim:
//
//	"PAFTAUYDU1"  (10 bayt)
//	uint32 LE     dizin uzunluğu (bayt)
//	JSON dizin    {"surum":1, "ad", "atif", "lisans", "zmin", "zmax", "kapsam":[b0,e0,b1,e1],
//	               "doseme": {"z/x/y": [konum, uzunluk], ...}}   konum: veri bölümünün başından
//	veri          JPEG / PNG döşemeler arka arkaya
//
// Dosya belleğe alınmaz; her döşeme istendiğinde diskten okunur (ReadAt eşzamanlı kullanıma uygundur).

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const uyduSihir = "PAFTAUYDU1"

type uyduPaketi struct {
	yol   string
	f     *os.File
	veri  int64
	dizin map[string][2]int64
	bilgi map[string]interface{} // arayüze giden özet (döşeme listesi dahil)
}

var (
	uyduMu  sync.RWMutex
	uyduAcik *uyduPaketi
)

func uyduAc(yol string) (*uyduPaketi, error) {
	f, err := os.Open(yol)
	if err != nil {
		return nil, err
	}
	bas := make([]byte, len(uyduSihir)+4)
	if _, err := io.ReadFull(f, bas); err != nil || string(bas[:len(uyduSihir)]) != uyduSihir {
		f.Close()
		return nil, errors.New("bu dosya bir PAFTA uydu paketi değil")
	}
	n := binary.LittleEndian.Uint32(bas[len(uyduSihir):])
	if n == 0 || n > 512<<20 {
		f.Close()
		return nil, errors.New("uydu paketinin dizini bozuk")
	}
	ham := make([]byte, n)
	if _, err := io.ReadFull(f, ham); err != nil {
		f.Close()
		return nil, errors.New("uydu paketi eksik: " + err.Error())
	}
	var d struct {
		Doseme map[string][2]int64 `json:"doseme"`
	}
	var bilgi map[string]interface{}
	if json.Unmarshal(ham, &d) != nil || json.Unmarshal(ham, &bilgi) != nil || len(d.Doseme) == 0 {
		f.Close()
		return nil, errors.New("uydu paketinin dizini okunamadı")
	}
	fi, _ := f.Stat()
	veri := int64(len(bas)) + int64(n)
	for k, v := range d.Doseme {
		if v[0] < 0 || v[1] <= 0 || veri+v[0]+v[1] > fi.Size() {
			f.Close()
			return nil, errors.New("uydu paketi eksik ya da bozuk (" + k + ")")
		}
	}
	anahtar := make([]string, 0, len(d.Doseme))
	for k := range d.Doseme {
		anahtar = append(anahtar, k)
	}
	delete(bilgi, "doseme")
	bilgi["anahtarlar"] = anahtar
	bilgi["dosya"] = filepath.Base(yol)
	bilgi["boyut"] = fi.Size()
	return &uyduPaketi{yol: yol, f: f, veri: veri, dizin: d.Doseme, bilgi: bilgi}, nil
}

/* açık paketi değiştir; nil verilirse kapatır */
func uyduDegistir(p *uyduPaketi) {
	uyduMu.Lock()
	eski := uyduAcik
	uyduAcik = p
	uyduMu.Unlock()
	if eski != nil {
		eski.f.Close()
	}
}

func uyduBilgi() map[string]interface{} {
	uyduMu.RLock()
	defer uyduMu.RUnlock()
	if uyduAcik == nil {
		return nil
	}
	return uyduAcik.bilgi
}

/* /<jeton>/__uydu/z/x/y */
func uyduSun(w http.ResponseWriter, r *http.Request) {
	i := strings.Index(r.URL.Path, "/__uydu/")
	if i < 0 {
		http.NotFound(w, r)
		return
	}
	k := r.URL.Path[i+len("/__uydu/"):]
	uyduMu.RLock()
	p := uyduAcik
	uyduMu.RUnlock()
	if p == nil {
		http.NotFound(w, r)
		return
	}
	v, ok := p.dizin[k]
	if !ok {
		http.NotFound(w, r)
		return
	}
	b := make([]byte, v[1])
	if _, err := p.f.ReadAt(b, p.veri+v[0]); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tur := "image/jpeg"
	if len(b) > 4 && b[0] == 0x89 && b[1] == 'P' {
		tur = "image/png"
	}
	w.Header().Set("Content-Type", tur)
	w.Header().Set("Cache-Control", "private, max-age=86400")
	w.Write(b)
}
