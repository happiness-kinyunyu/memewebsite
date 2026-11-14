
/*OOPSIE CORNER - AUDIO PLAYER */

const audioButtons = document.querySelectorAll(".audio-button");
const audioStatus = document.getElementById("audioStatus");

let activeAudio = null;
let activeButton = null;


// RESET THE PREVIOUS AUDIO

function stopCurrentAudio() {
    if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
    }

    if (activeButton) {
        activeButton.classList.remove("playing");
        activeButton.setAttribute("aria-pressed", "false");
    }

    activeAudio = null;
    activeButton = null;
}


// PLAY AUDIO

audioButtons.forEach((button) => {

    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", async () => {

        const audioFile = button.dataset.audio;
        const soundName = button.nextElementSibling.textContent;


        // IF THE SAME BUTTON IS PLAYING, PAUSE IT

        if (activeButton === button && activeAudio) {

            if (!activeAudio.paused) {
                activeAudio.pause();

                button.classList.remove("playing");
                button.setAttribute("aria-pressed", "false");

                audioStatus.textContent = "Sound paused. Choose another sound!";
                return;
            }

        } else {

            // STOP PREVIOUS AUDIO

            stopCurrentAudio();

            activeAudio = new Audio(audioFile);
            activeButton = button;
        }


        const currentAudio = activeAudio;

        button.classList.add("playing");
        button.setAttribute("aria-pressed", "true");

        audioStatus.textContent = `NOW PLAYING: ${soundName}`;


        // WHEN AUDIO FINISHES

        currentAudio.addEventListener("ended", () => {

            if (activeAudio !== currentAudio) return;

            stopCurrentAudio();

            audioStatus.textContent =
                "That was an Oopsie! Choose another sound.";

        }, { once: true });


        // IF AUDIO FILE IS MISSING

        currentAudio.addEventListener("error", () => {

            if (activeAudio !== currentAudio) return;

            stopCurrentAudio();

            audioStatus.textContent =
                "Audio could not be loaded. Check your MP3 file.";

        }, { once: true });


        // START PLAYING

        try {

            await currentAudio.play();

        } catch (error) {

            if (activeAudio !== currentAudio) return;

            stopCurrentAudio();

            audioStatus.textContent =
                "Audio could not play. Check your MP3 file.";

        }

    });

});

// Video cards open a native dialog player.
const videoDialog = document.getElementById("videoDialog");
const videoPlayer = document.getElementById("videoPlayer");
const videoMessage = document.getElementById("videoMessage");
const closeVideo = document.querySelector(".dialog-close");

document.querySelectorAll(".video-card").forEach((card) => {
  card.addEventListener("click", () => {
    const source = card.dataset.video;
    videoPlayer.pause();
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
    videoPlayer.src = source;
    videoMessage.textContent = "If playback does not start, check that this video file is in the videos folder.";
    videoDialog.showModal();
    videoPlayer.play().catch(() => {
      videoMessage.textContent = `Add your video file at: ${source}`;
    });
  });
});

function closeVideoDialog() {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();
  if (videoDialog.open) videoDialog.close();
}
closeVideo.addEventListener("click", closeVideoDialog);
videoDialog.addEventListener("click", (event) => {
  if (event.target === videoDialog) closeVideoDialog();
});
videoDialog.addEventListener("close", () => {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
});

// Current year in footer.
document.getElementById("year").textContent = new Date().getFullYear();
// OOPSIE CORNER SEARCH

const searchInput = document.getElementById("siteSearch");
const searchButton = document.getElementById("searchBtn");

const searchableItems = document.querySelectorAll(
    ".mosaic-tile, .video-card, .audio-button"
);

function searchWebsite() {
    const query = searchInput.value.trim().toLowerCase();

    searchableItems.forEach(item => {
        const searchableText = (
            item.innerText + " " +
            item.getAttribute("data-search")
        ).toLowerCase();

        if (searchableText.includes(query)) {
            item.classList.remove("search-hidden");
        } else {
            item.classList.add("search-hidden");
        }
    });
}

searchInput.addEventListener("input", searchWebsite);

searchButton.addEventListener("click", searchWebsite);

searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchWebsite();
    }
});