# Bootstrap Firebase Authentication

Dokumen ini digunakan untuk mengaktifkan akun produksi tanpa menyimpan password
atau credential admin di repository.

## 1. Aktifkan Authentication

Di Firebase Console project `peduli-pinrang`:

1. Buka **Authentication**.
2. Klik **Get started** jika diminta.
3. Buka **Sign-in method**.
4. Aktifkan **Email/Password**. Jangan aktifkan email link untuk MVP.

## 2. Buat Super Admin Pertama

1. Di tab **Users**, buat satu akun Email/Password.
2. Buka `https://peduli-pinrang.web.app/login` setelah mode demo dimatikan.
3. Login dengan akun tersebut.
4. Aplikasi menampilkan path `users/{uid}` jika profil belum tersedia.
5. Buat dokumen itu melalui Firestore Console:

```json
{
  "name": "Super Admin SampahTa",
  "email": "alamat-email-akun",
  "role": "SUPER_ADMIN",
  "isActive": true
}
```

Firestore Console menggunakan akses project owner sehingga dapat membuat
profil pertama walaupun client rules belum mengenali super admin.

Alternatif otomatis tersedia bila Application Default Credentials atau
service-account environment sudah dikonfigurasi:

```powershell
$env:BOOTSTRAP_PASSWORD = '<password-sementara-kuat>'
npm run bootstrap:user -- `
  --confirm-project=peduli-pinrang `
  --email=admin@example.com `
  --name="Super Admin SampahTa" `
  --role=SUPER_ADMIN
Remove-Item Env:BOOTSTRAP_PASSWORD
```

Password tidak boleh diberikan sebagai argumen command karena dapat tersimpan
pada shell history.

## 3. Buat Operator dan Driver

Untuk setiap akun:

1. Buat user pada Authentication.
2. Salin UID user.
3. Buat dokumen `users/{uid}`.
4. Gunakan role `OPERATOR` atau `DRIVER`.
5. Set `isActive: true`.

Contoh driver:

```json
{
  "name": "Nama Petugas",
  "email": "alamat-email-driver",
  "phoneNumber": "628xxxxxxxxxx",
  "role": "DRIVER",
  "isActive": true
}
```

Jangan memakai email atau password yang sama untuk beberapa petugas. Menonaktifkan
akses cukup dengan mengubah `isActive` menjadi `false`.

## 4. Aktifkan Mode Produksi

Setelah minimal satu super admin dan satu driver tersedia:

```env
VITE_USE_DEMO_DATA=false
VITE_DATA_PROVIDER=firestore
VITE_PROOF_MEDIA_PROVIDER=firestore
```

Kemudian jalankan:

```bash
npm run check:production
npm run test:all
npm run deploy:production
```

## 5. Verifikasi

- Akun tanpa profil diarahkan ke pesan konfigurasi role.
- Operator tidak dapat membuka route driver.
- Driver hanya melihat tiket dengan `assignedDriverId` sesuai UID-nya.
- Driver tidak dapat mengubah data customer atau tiket di luar tugasnya.
- Bukti pickup dibuat bersama perubahan status dalam atomic batch.
