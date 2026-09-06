// +build ignore

package main

import (
	"bytes"
	"compress/zlib"
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"hash/crc32"
	"os"
	"path/filepath"
)

// Simple PNG generator for solid-color icons

func writeChunk(w *bytes.Buffer, kind string, data []byte) {
	var lengthBuf [4]byte
	binary.BigEndian.PutUint32(lengthBuf[:], uint32(len(data)))
	w.Write(lengthBuf[:])
	w.Write([]byte(kind))
	w.Write(data)
	var crc [4]byte
	crc32.ChecksumIEEE([]byte(kind))
	crcVal := crc32.ChecksumIEEE(append([]byte(kind), data...))
	binary.BigEndian.PutUint32(crc[:], crcVal)
	w.Write(crc[:])
}

func generatePNG(width, height int, r, g, b, a uint8) []byte {
	var buf bytes.Buffer

	// PNG signature
	buf.Write([]byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})

	// IHDR
	ihdr := make([]byte, 13)
	binary.BigEndian.PutUint32(ihdr[0:4], uint32(width))
	binary.BigEndian.PutUint32(ihdr[4:8], uint32(height))
	ihdr[8] = 8 // bit depth
	ihdr[9] = 6 // color type: RGBA
	ihdr[10] = 0
	ihdr[11] = 0
	ihdr[12] = 0
	writeChunk(&buf, "IHDR", ihdr)

	// IDAT: raw image data with filter byte
	raw := make([]byte, height*(1+width*4))
	for y := 0; y < height; y++ {
		raw[y*(1+width*4)] = 0 // filter: None
		for x := 0; x < width; x++ {
			i := y*(1+width*4) + 1 + x*4
			raw[i] = r
			raw[i+1] = g
			raw[i+2] = b
			raw[i+3] = a
		}
	}

	var compressed bytes.Buffer
	wz := zlib.NewWriter(&compressed)
	wz.Write(raw)
	wz.Close()
	writeChunk(&buf, "IDAT", compressed.Bytes())

	// IEND
	writeChunk(&buf, "IEND", []byte{})

	return buf.Bytes()
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run genicons.go [192|512]")
		os.Exit(1)
	}

	size := 192
	if os.Args[1] == "512" {
		size = 512
	}

	outDir := filepath.Join("web", "public", "icons")
	os.MkdirAll(outDir, 0755)

	// Create two variants per size: one with pink accent, one original
	variants := []struct {
		name string
		r, g, b, a uint8
	}{
		{"icon", 255, 0, 110, 255},   // pink
		{"icon-dark", 13, 13, 43, 255}, // bg
	}

	for _, v := range variants {
		png := generatePNG(size, size, v.r, v.g, v.b, v.a)
		name := fmt.Sprintf("%s-%d.png", v.name, size)
		path := filepath.Join(outDir, name)
		os.WriteFile(path, png, 0644)
		fmt.Printf("Generated %s (%d bytes)\n", path, len(png))
	}

	// Also generate the favicon PNG
	png := generatePNG(32, 32, 255, 0, 110, 255)
	os.WriteFile(filepath.Join(outDir, "..", "favicon.png"), png, 0644)
	fmt.Printf("Generated favicon.png (%d bytes)\n", len(png))
}
