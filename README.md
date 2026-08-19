# VidGrab

# 🎬 VIDGRAB — Installation & Setup Guide

VIDGRAB is a modern video downloader built with **HTML, CSS, JavaScript, Node.js, yt-dlp, FFmpeg, and Deno**.

Paste a supported video URL, analyze the video, choose a format and quality, and download the finished file with real progress tracking through a clean and responsive interface.

> ⚠️ **Important:** Only download videos or other media that you are allowed to download. Respect the rules of the website and the rights of the content creator.

---

# 📥 1. Download VIDGRAB

Go to the VIDGRAB GitHub repository.

Click:

**Code → Download ZIP**

Your browser will download a file similar to:

```text
vidgrab-main.zip
```

Do **not** open the files directly from inside the ZIP.

---

# 📂 2. Extract the ZIP file

Open **File Explorer**.

Find the downloaded `vidgrab-main.zip` file.

Right-click it and choose:

**Extract All...**

Choose where you want to store VIDGRAB and click **Extract**.

You should now have a normal VIDGRAB folder containing files such as:

```text
VIDGRAB
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── server.js
└── yt-dlp.exe
```

---

# 🎞️ 3. Install FFmpeg

VIDGRAB uses **FFmpeg** to process and combine video and audio files.

Because `ffmpeg.exe` is too large to include directly in the GitHub repository, you need to download it separately.

Go to:

https://www.gyan.dev/ffmpeg/builds/

Download:

**ffmpeg-release-essentials.zip**

After the download finishes:

1. Open **File Explorer**.
2. Find `ffmpeg-release-essentials.zip`.
3. Right-click it.
4. Click **Extract All...**
5. Open the extracted folder.
6. Open the **bin** folder.
7. Find:

```text
ffmpeg.exe
```

8. Copy `ffmpeg.exe`.
9. Go back to your **VIDGRAB** folder.
10. Paste `ffmpeg.exe` directly inside it.

Your folder should now look like:

```text
VIDGRAB
├── ffmpeg.exe
├── index.html
├── package.json
├── package-lock.json
├── server.js
├── yt-dlp.exe
└── ...
```

**Make sure `ffmpeg.exe` is next to `server.js`, not inside another folder.**

---

# 🟢 4. Install Node.js

VIDGRAB's backend uses **Node.js**, so Node.js must be installed before `npm install` or `npm start` will work.

Go to:

https://nodejs.org/en/download

Download and install the recommended **LTS** version of Node.js.

During installation, you can leave the default options selected.

When the installation finishes, continue to the next step.

---

# 💻 5. Open the VIDGRAB terminal

Open your VIDGRAB folder in **File Explorer**.

Click the **address bar** at the top of the window.

Type:

```text
CMD
```

and press **Enter**.

A Command Prompt window should open with the VIDGRAB folder already selected.

It should look similar to:

```text
C:\...\VIDGRAB>
```

This is important because the commands in the next step need to be run **inside the VIDGRAB folder**.

---

# 📦 6. Install the required Node.js packages

In the Command Prompt, type:

```bash
npm install
```

Press **Enter**.

Wait for the installation to finish.

This installs the Node.js dependencies required by VIDGRAB.

You only need to do this when setting up the project for the first time.

When it finishes, you should have a new folder called:

```text
node_modules
```

inside the VIDGRAB folder.

---

# 🚀 7. Start VIDGRAB

In the same Command Prompt window, type:

```bash
npm start
```

Press **Enter**.

VIDGRAB should start its local server.

You should see something similar to:

```text
=================================
          VIDGRAB 🚀
=================================
Running at: http://localhost:3000
yt-dlp: OK
FFmpeg: OK
Deno: ...
=================================
```

### ⚠️ Important

**Do not close this Command Prompt window while you are using VIDGRAB.**

The server needs to keep running.

---

# 🦕 8. Install Deno

VIDGRAB uses **Deno** as a JavaScript runtime for some video extraction features.

Open **Windows PowerShell**.

You can find it by opening the Windows Start menu and searching for:

```text
PowerShell
```

Open **Windows PowerShell**.

Paste this command:

```powershell
irm https://deno.land/install.ps1 | iex
```

Press **Enter**.

Wait until the installation finishes.

You should see a message saying that Deno was installed successfully.

---

# 🔄 9. Restart VIDGRAB

After installing Deno, go back to your VIDGRAB Command Prompt.

Stop the current server by pressing:

```text
Ctrl + C
```

Then start it again:

```bash
npm start
```

This allows VIDGRAB to detect the newly installed Deno runtime.

---

# 🌐 10. Open VIDGRAB

Once the server is running, open:

```text
http://localhost:3000
```

in Google Chrome.

You can either:

* Hold **Ctrl** and click the `http://localhost:3000` address shown in the terminal, or
* Copy `http://localhost:3000` and paste it into Chrome's address bar.

You should now see the VIDGRAB website. 🎉

---

# 🎥 11. Download a video

Now you're ready to use VIDGRAB.

### Step 1

Find a supported video on a website.

### Step 2

Copy the video's URL.

For example:

```text
https://www.youtube.com/watch?v=...
```

### Step 3

Paste the URL into the VIDGRAB input box.

### Step 4

Choose your preferred:

**Format**

* MP4 Video
* WebM Video
* MP3 Audio

and choose your preferred:

**Quality**

* Original
* 1080p
* 720p
* 480p
* 360p

### Step 5

Click:

**🔽 Download**

VIDGRAB will analyze the URL and display information about the video.

You should see things such as:

* Video thumbnail
* Video title
* Video information
* Download progress

VIDGRAB will then download and process the file using **yt-dlp and FFmpeg**.

Depending on the video, quality, server, and your internet connection, the download may take some time.

When the download finishes, click:

**💾 Save finished file**

Your downloaded file will then be available on your computer. 🎬

---

# 🛠️ Troubleshooting

## `npm` is not recognized

Make sure Node.js is installed correctly.

Close Command Prompt, open a new one, and try:

```bash
node --version
```

Then:

```bash
npm --version
```

If both commands show version numbers, Node.js is installed correctly.

---

## `yt-dlp.exe was not found`

Make sure `yt-dlp.exe` is directly inside the VIDGRAB folder.

It should look like:

```text
VIDGRAB
├── yt-dlp.exe
├── server.js
├── index.html
└── ...
```

---

## `ffmpeg.exe was not found`

Make sure you copied **`ffmpeg.exe` itself** from the FFmpeg `bin` folder into the main VIDGRAB folder.

Do not leave it inside:

```text
ffmpeg-release-essentials
└── bin
    └── ffmpeg.exe
```

It needs to be directly inside:

```text
VIDGRAB
└── ffmpeg.exe
```

---

## VIDGRAB does not open

Make sure this command is still running:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Also make sure you did not accidentally close the Command Prompt window.

---

## Deno is not detected

Make sure you installed Deno using:

```powershell
irm https://deno.land/install.ps1 | iex
```

Then restart the VIDGRAB server with:

```text
Ctrl + C
```

followed by:

```bash
npm start
```

---

# ✅ Final Folder Structure

When everything is installed correctly, your VIDGRAB folder should look approximately like this:

```text
VIDGRAB
│
├── downloads
│
├── node_modules
│
├── ffmpeg.exe
├── index.html
├── package.json
├── package-lock.json
├── server.js
├── yt-dlp.exe
└── README.md
```

You do **not** need to put Deno inside the VIDGRAB folder. Deno is installed separately on your Windows system.

---

# 🎉 You're Done!

Once all of the steps above are complete, VIDGRAB is ready to use.

Start the server with:

```bash
npm start
```

and open:

```text
http://localhost:3000
```

Then paste a supported video URL and let VIDGRAB do the rest. 🚀🎬
