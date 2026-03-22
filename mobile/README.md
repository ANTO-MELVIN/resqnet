# ResQNet Android App (Expo)

Android app flow:
1. Login
2. Platform info
3. Main dashboard (alerts, resources, reports)

## Prerequisites
- Node.js 18+
- npm
- Android Studio emulator or Expo Go on Android phone
- Flask backend running with MongoDB Atlas URI

## 1) Start backend API (Atlas required)
From project `app` folder:

```powershell
$env:MONGO_URI="mongodb+srv://<user>:<password>@cluster0.dg5izth.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
C:/Users/ASUS/AppData/Local/Python/pythoncore-3.14-64/python.exe app.py
```

Verify:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5000/health | Select-Object -ExpandProperty Content
```

`dbConnected` should be `true`.

## 2) Configure mobile API URL
Use one of these before starting Expo:

- Android emulator:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:5000"
```

- Physical Android phone (same Wi-Fi, replace with your PC IP):

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.x.x:5000"
```

## 3) Run Android app

```powershell
cd mobile
npm install
npm run android
```

If port `5000` is already used on your PC, run backend on `5002` and set:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:5002"
```

If you get `No Android connected device found`, start an emulator from Android Studio (Device Manager) or connect a phone with USB debugging enabled.

## Troubleshooting
- `Unable to connect to backend API`:
	- Confirm backend `/health` is reachable.
	- Use `10.0.2.2` for emulator, not `127.0.0.1`.
	- Ensure phone and PC are on same Wi-Fi for LAN IP mode.
- `dbConnected: false`:
	- Check Atlas Network Access (IP whitelist).
	- Check Atlas user/password in `MONGO_URI`.
