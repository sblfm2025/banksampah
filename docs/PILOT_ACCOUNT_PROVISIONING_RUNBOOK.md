# Runbook Provisioning Akun Pilot

Tanggal acuan: 14 Juni 2026.

Status terakhir:

- Super Admin tersedia: `WdaDYQI0TqMf8ZubTFeXfKcBV9v1`
- Operator belum tersedia.
- Driver utama belum tersedia.
- `check:production` sengaja memblokir deploy Hosting sampai dua akun itu
  tersedia dan profil role dapat diverifikasi.

## 1. Siapkan Credential Admin

Pilih salah satu:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\di-luar-repo\service-account.json'
```

atau:

```powershell
$env:FIREBASE_CLIENT_EMAIL = '<client-email-service-account>'
$env:FIREBASE_PRIVATE_KEY = '<private-key-dengan-\n>'
```

Jangan simpan service account JSON atau private key di Git.

## 2. Buat Operator

Gunakan identitas nyata yang disetujui pengurus.

```powershell
$env:BOOTSTRAP_PASSWORD = '<password-sementara-kuat>'
npm run bootstrap:user -- `
  --confirm-project=peduli-pinrang `
  --email=operator@domain-resmi.test `
  --name="Operator Peduli Pinrang" `
  --role=OPERATOR `
  --write-pilot-uid=true
Remove-Item Env:BOOTSTRAP_PASSWORD
```

## 3. Buat Driver Utama

```powershell
$env:BOOTSTRAP_PASSWORD = '<password-sementara-kuat>'
npm run bootstrap:user -- `
  --confirm-project=peduli-pinrang `
  --email=driver@domain-resmi.test `
  --name="Petugas Jemput Utama" `
  --role=DRIVER `
  --write-pilot-uid=true
Remove-Item Env:BOOTSTRAP_PASSWORD
```

Jika driver lebih nyaman login memakai WhatsApp, ganti `--email=...` dengan
`--phone=08xxxxxxxxxx`.

## 4. Verifikasi

```bash
npm run check:production
```

Target:

```text
OK  UID role pilot: SUPER_ADMIN, OPERATOR, dan DRIVER dikonfigurasi
OK  Akun Authentication: ...
OK  Profil role Firestore: 3/3 profil aktif dan sesuai
```

## 5. Setelah OK

```bash
npm run test:all
npm run deploy:production
```

`deploy:production` akan berhenti otomatis bila readiness belum `OK`.
