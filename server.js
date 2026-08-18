const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();

const PORT = 3000;
const ROOT = __dirname;

// ============================================================
// FILE LOCATIONS
// ============================================================

const YTDLP = path.join(ROOT, "yt-dlp.exe");
const FFMPEG = path.join(ROOT, "ffmpeg.exe");

const DENO = path.join(
    process.env.USERPROFILE || "",
    ".deno",
    "bin",
    "deno.exe"
);

const DOWNLOAD_DIR = path.join(ROOT, "downloads");

fs.mkdirSync(DOWNLOAD_DIR, {
    recursive: true
});

// ============================================================
// EXPRESS
// ============================================================

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(express.static(ROOT));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(ROOT, "index.html")
    );
});

// ============================================================
// HELPERS
// ============================================================

function validUrl(value) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch {
        return false;
    }
}


// Detect YouTube
function isYouTubeUrl(value) {
    try {
        const host =
            new URL(value)
                .hostname
                .toLowerCase();

        return (
            host === "youtube.com" ||
            host.endsWith(".youtube.com") ||
            host === "youtu.be" ||
            host.endsWith(".youtu.be")
        );

    } catch {
        return false;
    }
}


// ============================================================
// FORMAT SELECTORS
// ============================================================
//
// We deliberately avoid forcing bv*+ba on fallback clients.
// Some current YouTube clients expose only limited formats.
// yt-dlp's "best" fallback can choose an actually available
// combined format instead.
//
// ============================================================

function getFormatAttempts(format, quality) {

    if (format === "mp3") {

        return [
            "bestaudio/best"
        ];

    }


    let height = "";

    switch (quality) {

        case "1080p":
            height = "1080";
            break;

        case "720p":
            height = "720";
            break;

        case "480p":
            height = "480";
            break;

        case "360p":
            height = "360";
            break;

        default:
            height = "";
            break;

    }


    // For the normal yt-dlp client:
    // Prefer a proper video+audio combination.
    //
    // Then fall back to a single combined format.

    if (height) {

        return [

            `bestvideo*[height<=${height}]+bestaudio/best[height<=${height}]/best`,

            `best[height<=${height}]/best`

        ];

    }


    return [

        "bestvideo*+bestaudio/best",

        "best"

    ];

}


// ============================================================
// DENO
// ============================================================

function buildRuntimeArgs() {

    if (!fs.existsSync(DENO)) {
        return [];
    }

    return [
        "--js-runtimes",
        `deno:${DENO}`
    ];

}


function buildProcessEnv() {

    const denoFolder =
        path.dirname(DENO);

    const currentPath =
        process.env.PATH || "";

    return {

        ...process.env,

        PATH:
            `${denoFolder};${currentPath}`

    };

}


// ============================================================
// YOUTUBE CLIENTS
// ============================================================
//
// Current yt-dlp documentation says tv/android_vr/
// web_embedded do not require a GVS PO token, but they
// can have format limitations.
//
// We use them ONLY as fallbacks.
// ============================================================

function getClientAttempts(url) {

    if (!isYouTubeUrl(url)) {

        return [
            null
        ];

    }

    return [

        // First: normal/default yt-dlp behavior
        null,

        // Fallbacks
        "tv",

        "android_vr",

        "web_embedded"

    ];

}


function clientArgs(client) {

    if (!client) {
        return [];
    }

    return [

        "--extractor-args",
        `youtube:player_client=${client}`

    ];

}


// ============================================================
// PROGRESS
// ============================================================

function parseProgress(line) {

    const match =
        line.match(
            /\[download\]\s+(\d+(?:\.\d+)?)%.*?(?:(\d+(?:\.\d+)?[KMG]i?B\/s))?.*?(?:ETA\s+([0-9:]+))?/i
        );


    if (!match) {
        return null;
    }


    return {

        percent:
            Number(match[1]) || 0,

        speed:
            match[2] || "",

        eta:
            match[3] || ""

    };

}


// ============================================================
// FILE FINDER
// ============================================================

function findNewestFile(folder) {

    if (!fs.existsSync(folder)) {
        return null;
    }


    const files =
        fs
            .readdirSync(folder)

            .map(
                file =>
                    path.join(
                        folder,
                        file
                    )
            )

            .filter(
                file => {

                    try {

                        return fs
                            .statSync(file)
                            .isFile();

                    } catch {

                        return false;

                    }

                }
            );


    if (!files.length) {
        return null;
    }


    files.sort(
        (a, b) =>
            fs.statSync(b).mtimeMs -
            fs.statSync(a).mtimeMs
    );


    return files[0];

}


// ============================================================
// JOB STORAGE
// ============================================================

const jobs = new Map();


// ============================================================
// RUN YT-DLP FOR INFO
// ============================================================

function getVideoInfo(url, client = null) {

    return new Promise(
        resolve => {

            const args = [

                "--dump-single-json",

                "--no-playlist",

                "--no-warnings",

                "--skip-download"

            ];


            // Deno

            args.push(
                ...buildRuntimeArgs()
            );


            // Optional YouTube client

            args.push(
                ...clientArgs(client)
            );


            args.push(url);


            console.log("");
            console.log(
                "[VIDGRAB] INFO ATTEMPT"
            );
            console.log(
                "Client:",
                client || "default"
            );


            const child =
                spawn(
                    YTDLP,
                    args,
                    {
                        cwd: ROOT,
                        windowsHide: true,
                        env: buildProcessEnv()
                    }
                );


            let stdout = "";
            let stderr = "";


            child.stdout.on(
                "data",
                data => {

                    stdout +=
                        data.toString();

                }
            );


            child.stderr.on(
                "data",
                data => {

                    stderr +=
                        data.toString();

                }
            );


            child.on(
                "error",
                error => {

                    resolve({

                        success: false,

                        error:
                            error.message

                    });

                }
            );


            child.on(
                "close",
                code => {

                    if (code !== 0) {

                        resolve({

                            success: false,

                            error:
                                stderr
                                    .trim()
                                    .split(/\r?\n/)
                                    .filter(Boolean)
                                    .slice(-10)
                                    .join(" ")
                                ||
                                `yt-dlp exited with code ${code}.`

                        });

                        return;

                    }


                    try {

                        const info =
                            JSON.parse(
                                stdout
                            );


                        resolve({

                            success:
                                true,

                            info

                        });

                    } catch {

                        resolve({

                            success:
                                false,

                            error:
                                "yt-dlp returned invalid JSON."

                        });

                    }

                }
            );

        }
    );

}


// ============================================================
// ANALYZE ENDPOINT
// ============================================================

app.post(
    "/api/info",
    async (req, res) => {

        const { url } =
            req.body || {};


        if (!validUrl(url)) {

            return res.status(400).json({

                error:
                    "Please provide a valid HTTP/HTTPS URL."

            });

        }


        if (!fs.existsSync(YTDLP)) {

            return res.status(500).json({

                error:
                    "yt-dlp.exe was not found next to server.js."

            });

        }


        if (!fs.existsSync(DENO)) {

            return res.status(500).json({

                error:
                    `Deno was not found at:\n${DENO}`

            });

        }


        const clients =
            getClientAttempts(url);


        let lastError =
            "Unable to analyze this video.";


        for (
            const client
            of clients
        ) {

            const result =
                await getVideoInfo(
                    url,
                    client
                );


            if (result.success) {

                const info =
                    result.info;


                console.log(
                    "[VIDGRAB] ✅ INFO FOUND"
                );


                return res.json({

                    id:
                        info.id ||
                        "",

                    title:
                        info.title ||
                        "Untitled video",

                    thumbnail:
                        info.thumbnail ||
                        "",

                    duration:
                        info.duration ||
                        null,

                    uploader:
                        info.uploader ||
                        info.channel ||
                        "",

                    ext:
                        info.ext ||
                        "video"

                });

            }


            lastError =
                result.error;

            console.log(
                "[VIDGRAB] Info attempt failed:",
                lastError
            );

        }


        return res.status(400).json({

            error:
                lastError

        });

    }
);


// ============================================================
// RUN DOWNLOAD ATTEMPT
// ============================================================

function runDownloadAttempt(
    job,
    url,
    format,
    quality,
    client,
    jobFolder,
    formatSelector
) {

    return new Promise(
        resolve => {

            job.status =
                "starting";


            job.percent =
                0;


            job.speed =
                "";


            job.eta =
                "";


            job.message =
                client
                    ? `Trying YouTube client: ${client}`
                    : "Starting download...";


            const args = [

                "--newline",

                "--no-playlist",

                "--progress",

                "--retries",
                "3",

                "--fragment-retries",
                "3",

                "--extractor-retries",
                "3",

                "--ffmpeg-location",
                FFMPEG

            ];


            // Deno
            args.push(
                ...buildRuntimeArgs()
            );


            // Client
            args.push(
                ...clientArgs(client)
            );


            // Format
            args.push(
                "-f",
                formatSelector
            );


            // Merge container

            if (format !== "mp3") {

                args.push(

                    "--merge-output-format",

                    format === "webm"
                        ? "webm"
                        : "mp4"

                );

            }


            // MP3
            if (format === "mp3") {

                args.push(

                    "-x",

                    "--audio-format",
                    "mp3",

                    "--audio-quality",
                    "0"

                );

            }


            // Output

            args.push(

                "-o",

                path.join(

                    jobFolder,

                    "%(title).120s [%(id)s].%(ext)s"

                )

            );


            // URL

            args.push(url);


            console.log("");
            console.log(
                "---------------------------------"
            );
            console.log(
                "[VIDGRAB] DOWNLOAD ATTEMPT"
            );
            console.log(
                "Client:",
                client || "default"
            );
            console.log(
                "Format:",
                formatSelector
            );
            console.log(
                "Quality:",
                quality
            );
            console.log(
                "---------------------------------"
            );


            const child =
                spawn(
                    YTDLP,
                    args,
                    {
                        cwd: ROOT,
                        windowsHide: true,
                        env: buildProcessEnv()
                    }
                );


            let stderr = "";


            // ==================================================
            // STDOUT
            // ==================================================

            child.stdout.on(
                "data",
                data => {

                    const text =
                        data.toString();


                    for (
                        const line
                        of text.split(/\r?\n/)
                    ) {

                        const parsed =
                            parseProgress(
                                line
                            );


                        if (parsed) {

                            job.percent =
                                parsed.percent;

                            job.speed =
                                parsed.speed;

                            job.eta =
                                parsed.eta;

                            job.status =
                                "downloading";

                            job.message =
                                "Downloading...";

                        }


                        if (

                            line.includes(
                                "[Merger]"
                            )

                            ||

                            line.includes(
                                "[ExtractAudio]"
                            )

                        ) {

                            job.status =
                                "processing";

                            job.message =
                                "FFmpeg is processing the file...";

                        }

                    }

                }
            );


            // ==================================================
            // STDERR
            // ==================================================

            child.stderr.on(
                "data",
                data => {

                    const text =
                        data.toString();


                    stderr +=
                        text;


                    console.log(
                        text.trim()
                    );

                }
            );


            // ==================================================
            // ERROR
            // ==================================================

            child.on(
                "error",
                error => {

                    resolve({

                        success:
                            false,

                        error:
                            error.message

                    });

                }
            );


            // ==================================================
            // CLOSED
            // ==================================================

            child.on(
                "close",
                code => {

                    const outputFile =
                        findNewestFile(
                            jobFolder
                        );


                    if (
                        code === 0 &&
                        outputFile
                    ) {

                        resolve({

                            success:
                                true,

                            outputFile

                        });

                        return;

                    }


                    const errorText =

                        stderr
                            .trim()
                            .split(/\r?\n/)
                            .filter(Boolean)
                            .slice(-10)
                            .join(" ")

                        ||

                        `yt-dlp exited with code ${code}.`;


                    resolve({

                        success:
                            false,

                        error:
                            errorText

                    });

                }
            );

        }
    );

}


// ============================================================
// DOWNLOAD ENDPOINT
// ============================================================

app.post(
    "/api/download",
    async (req, res) => {

        const {

            url,

            format =
                "mp4",

            quality =
                "Original"

        } = req.body || {};


        if (!validUrl(url)) {

            return res.status(400).json({

                error:
                    "Please provide a valid HTTP/HTTPS URL."

            });

        }


        if (!fs.existsSync(YTDLP)) {

            return res.status(500).json({

                error:
                    "yt-dlp.exe was not found."

            });

        }


        if (!fs.existsSync(FFMPEG)) {

            return res.status(500).json({

                error:
                    "ffmpeg.exe was not found."

            });

        }


        if (!fs.existsSync(DENO)) {

            return res.status(500).json({

                error:
                    `Deno was not found at:\n${DENO}`

            });

        }


        // =====================================================
        // JOB
        // =====================================================

        const jobId =

            `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;


        const jobFolder =
            path.join(
                DOWNLOAD_DIR,
                jobId
            );


        fs.mkdirSync(
            jobFolder,
            {
                recursive: true
            }
        );


        const job = {

            status:
                "starting",

            percent:
                0,

            speed:
                "",

            eta:
                "",

            message:
                "Starting...",

            outputFile:
                null,

            createdAt:
                Date.now()

        };


        jobs.set(
            jobId,
            job
        );


        // Return immediately
        res.json({
            jobId
        });


        // =====================================================
        // CLIENTS
        // =====================================================

        const clients =
            getClientAttempts(url);


        // =====================================================
        // FORMAT ATTEMPTS
        // =====================================================

        const formatAttempts =
            getFormatAttempts(
                format,
                quality
            );


        // =====================================================
        // TRY EVERYTHING
        // =====================================================

        for (
            const client
            of clients
        ) {

            for (
                const formatSelector
                of formatAttempts
            ) {

                const result =
                    await runDownloadAttempt(

                        job,

                        url,

                        format,

                        quality,

                        client,

                        jobFolder,

                        formatSelector

                    );


                if (result.success) {

                    job.outputFile =
                        result.outputFile;


                    job.status =
                        "completed";


                    job.percent =
                        100;


                    job.message =
                        "Download finished.";


                    console.log("");
                    console.log(
                        "================================="
                    );
                    console.log(
                        "[VIDGRAB] ✅ DOWNLOAD FINISHED"
                    );
                    console.log(
                        "Client:",
                        client || "default"
                    );
                    console.log(
                        "Format:",
                        formatSelector
                    );
                    console.log(
                        "File:",
                        result.outputFile
                    );
                    console.log(
                        "================================="
                    );
                    console.log("");


                    return;

                }


                console.log("");
                console.log(
                    "[VIDGRAB] Attempt failed:"
                );
                console.log(
                    result.error
                );
                console.log("");

            }

        }


        // =====================================================
        // ALL FAILED
        // =====================================================

        job.status =
            "error";


        job.percent =
            0;


        job.message =

            "VIDGRAB could not download this video. " +

            "YouTube may require additional PO-token/session " +

            "attestation data for this particular video or IP.";


        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "[VIDGRAB] ❌ ALL ATTEMPTS FAILED"
        );
        console.log(
            "YouTube may currently require additional " +
            "PO-token/session data."
        );
        console.log(
            "================================="
        );
        console.log("");

    }
);


// ============================================================
// STATUS
// ============================================================

app.get(
    "/api/status/:id",
    (req, res) => {

        const job =
            jobs.get(
                req.params.id
            );


        if (!job) {

            return res.status(404).json({

                error:
                    "Job not found."

            });

        }


        res.json({

            status:
                job.status,

            percent:
                job.percent,

            speed:
                job.speed,

            eta:
                job.eta,

            message:
                job.message

        });

    }
);


// ============================================================
// FILE
// ============================================================

app.get(
    "/api/file/:id",
    (req, res) => {

        const job =
            jobs.get(
                req.params.id
            );


        if (

            !job ||

            job.status !==
                "completed" ||

            !job.outputFile ||

            !fs.existsSync(
                job.outputFile
            )

        ) {

            return res
                .status(404)
                .send(
                    "File not ready."
                );

        }


        res.download(

            job.outputFile,

            path.basename(
                job.outputFile
            )

        );

    }
);


// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "          VIDGRAB 🚀"
        );
        console.log(
            "================================="
        );

        console.log(
            `Running at: http://localhost:${PORT}`
        );

        console.log(
            `yt-dlp: ${
                fs.existsSync(YTDLP)
                    ? "OK"
                    : "MISSING"
            }`
        );

        console.log(
            `FFmpeg: ${
                fs.existsSync(FFMPEG)
                    ? "OK"
                    : "MISSING"
            }`
        );

        console.log(
            `Deno: ${
                fs.existsSync(DENO)
                    ? "OK"
                    : "NOT FOUND"
            }`
        );

        console.log(
            `Deno path: ${DENO}`
        );

        console.log(
            "Download strategy: default → tv → android_vr → web_embedded"
        );

        console.log(
            "Press Ctrl+C to stop."
        );

        console.log(
            "================================="
        );

        console.log("");

    }
);