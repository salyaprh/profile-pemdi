# Panduan CMS PEMDI PANRB

Untuk staf yang mengelola konten situs. Tidak perlu kemampuan teknis. Panel CMS ada di `<alamat situs>/admin`.

## Dua peran

| Bisa dilakukan                                                                   | Penulis               | Admin |
| -------------------------------------------------------------------------------- | --------------------- | ----- |
| Menulis artikel, menyimpan draf, mengunggah gambar                               | Ya (artikel miliknya) | Ya    |
| Mengajukan artikel untuk ditinjau, atau menariknya kembali                       | Ya (artikel miliknya) | Ya    |
| Menerbitkan, mengembalikan dengan catatan, membatalkan terbit                    | Tidak                 | Ya    |
| Mengubah artikel yang sudah terbit, memindahkan ke sampah, memulihkan, menghapus | Tidak                 | Ya    |
| Kategori, Pesan, Pengguna, Pengaturan, Aktivitas                                 | Tidak                 | Ya    |

Artikel tidak tampil di situs sebelum Admin menerbitkannya. Dengan begitu setiap konten resmi diperiksa oleh orang kedua.

## Masuk pertama kali

1. Buka `/admin` lalu masuk dengan email dan **kata sandi sementara** dari Admin.
2. Anda langsung diminta mengganti kata sandi. Panel baru terbuka setelah itu.
3. Kata sandi baru minimal 12 karakter dengan huruf besar, huruf kecil, dan angka. Jangan dibagikan; tidak ada orang, termasuk Admin, yang perlu mengetahuinya.

Sesi berakhir otomatis setelah 60 menit tanpa aktivitas, dan Anda diminta masuk lagi. Menu **Akun saya** dipakai untuk mengganti kata sandi kapan saja. Bila lupa kata sandi, minta Admin mengaturnya ulang (Admin tidak bisa melihat kata sandi lama, hanya membuat yang sementara).

## Menulis artikel (Penulis dan Admin)

1. Buka **Artikel**, lalu **Tulis artikel**.
2. Isi **Judul**, **Kategori**, dan **Ringkasan**. Ringkasan tampil di kartu daftar dan di pratinjau saat tautan dibagikan di WhatsApp, jadi tulis satu atau dua kalimat yang jelas.
3. Tulis isi di editor. Toolbar menyediakan judul, tebal, miring, tautan, daftar, kutipan, dan gambar. Tautan hanya boleh ke `http`, `https`, atau `mailto`.
4. **Gambar sampul** dan gambar di dalam isi: JPEG, PNG, atau WebP, maksimal 5 MB. Saat menyisipkan gambar ke isi, **teks alternatif** wajib diisi (minimal 3 karakter) untuk pembaca layar. Sistem mengubahnya ke WebP dan membuang data lokasi (EXIF) dari foto. SVG ditolak.
5. **Slug** (bagian alamat artikel): kosongkan agar dibuat otomatis dari judul. Jangan diubah setelah artikel terbit karena tautan lama menjadi tidak berlaku.
6. Klik **Simpan draf** kapan saja. Bila Anda menutup halaman saat ada perubahan yang belum disimpan, browser akan bertanya dulu.
7. Bila sudah siap, klik **Ajukan untuk ditinjau**. Status berubah dari Draf menjadi Ditinjau, dan Penulis tidak bisa mengeditnya lagi. Salah ajukan? Klik **Tarik pengajuan**.

Artikel yang dikembalikan Admin kembali berstatus Draf dengan **Catatan perbaikan dari Admin** di bagian atas editor. Perbaiki, lalu ajukan lagi.

## Meninjau dan menerbitkan (Admin)

1. Di **Artikel**, filter status **Ditinjau**, lalu buka artikelnya.
2. Bila sudah benar, klik **Terbitkan**. Artikel langsung tampil di situs, tanpa deploy ulang.
3. Bila perlu perbaikan, klik **Kembalikan ke Penulis** dan tulis catatan yang spesifik (wajib diisi).
4. **Batalkan terbit** menarik artikel dari situs dan mengembalikannya menjadi Draf. **Pindahkan ke sampah** menyembunyikannya dari situs; dari filter **Sampah** artikel bisa dipulihkan lewat **Pulihkan dari sampah**, atau dihapus permanen (tidak bisa dibatalkan).

## Kategori (Admin)

**Kategori** berisi daftar kategori artikel. Gunakan **Tambah kategori** untuk membuat yang baru. Kategori yang masih dipakai artikel, termasuk artikel di sampah, tidak bisa dihapus; pindahkan artikelnya ke kategori lain dulu.

## Pesan masuk (Admin)

Pesan dari formulir Hubungi kami muncul di **Pesan** dan ditandai belum dibaca sampai dibuka. Gunakan **Balas lewat email** untuk menjawab dari aplikasi email Anda.

Pesan berisi data pribadi pengirim. Karena itu:

- Pesan tersimpan terenkripsi dan **dihapus otomatis setelah 12 bulan**.
- Jangan menyalin atau meneruskan pesan di luar keperluan menjawabnya.
- Hapus pesan yang sudah tidak diperlukan dengan **Hapus pesan**.

## Pengguna (Admin)

- **Tambah pengguna** membuat akun baru dengan kata sandi sementara (bisa dibuat acak). Sampaikan kata sandi itu lewat kanal yang aman, bukan lewat pesan grup.
- Ubah peran, nonaktifkan, atau **Atur ulang kata sandi** dari halaman pengguna. Akun yang dinonaktifkan atau diatur ulang kata sandinya langsung keluar dari semua sesi.
- Pengaman: Anda tidak bisa mengubah peran atau menonaktifkan akun sendiri, dan harus selalu tersisa minimal satu Admin aktif.
- Tidak ada pendaftaran mandiri. Setiap akun dibuat oleh Admin.

## Pengaturan situs (Admin)

**Pengaturan** mengatur deskripsi situs, tiga angka statistik di beranda beserta keterangannya, kontak (email, telepon, alamat), dan tautan media sosial (harus diawali `https://`). Kolom yang dikosongkan tidak ditampilkan. Isinya ditampilkan sebagai teks biasa, bukan HTML.

## Aktivitas (Admin)

**Aktivitas** mencatat siapa melakukan apa dan kapan: masuk dan gagal masuk, perubahan artikel, kategori, pengguna, dan pengaturan. Catatannya hanya bisa dibaca, memuat alamat IP, dan dihapus otomatis setelah 24 bulan. Gunakan untuk menelusuri perubahan, atau bila ada percobaan masuk yang mencurigakan.

## Tips

- Tulis ringkasan dan judul yang bisa berdiri sendiri; keduanya muncul di pratinjau WhatsApp.
- Teks alternatif gambar sebaiknya menjelaskan isi gambar, bukan sekadar nama berkas, agar berguna bagi pembaca layar.
- Periksa tampilan artikel di situs setelah terbit, termasuk dari ponsel.
- Jangan mengunggah gambar yang berisi data pribadi atau dokumen internal.
- Keluar (**Keluar**) saat memakai komputer bersama.
