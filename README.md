# INA Digital UI - React Starter Project

Starter project untuk memulai menggunakan INA Digital Design System dengan React, Vite, dan Tailwind CSS v4.

## 🚀 Quick Start

1. **Unzip project ini**

   ```bash
   unzip idds-react-starter.zip
   cd idds-react-starter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Jalankan development server**

   ```bash
   npm run dev
   ```

4. **Buka browser**
   ```
   http://localhost:5173
   ```

## 📦 Dependencies

Project ini sudah dikonfigurasi dengan:

- **React** ^18.2.0
- **Vite** ^5.0.8
- **Tailwind CSS** v4.1.6
- **@idds/react** ^1.3.5
- **@tabler/icons-react** ^3.31.0
- **TypeScript** ^5.2.2

## 🎨 Brand Theme

Untuk mengubah brand theme, edit file `src/main.tsx`:

```tsx
import { setBrandTheme } from '@idds/react';

// Pilih salah satu: 'inagov', 'inaku', 'bgn', 'bkn', 'lan', 'default'
setBrandTheme('default');
```

## 📚 Dokumentasi

Untuk dokumentasi lengkap, kunjungi:

- [INA Digital Design System](https://designsystem.ina.go.id)
- [Getting Started Guide](https://designsystem.ina.go.id/getting-started/developer)

## 🛠️ Build untuk Production

```bash
npm run build
```

File hasil build akan berada di folder `dist/`.

## 📝 License

MIT
