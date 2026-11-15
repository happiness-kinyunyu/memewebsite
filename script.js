
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


// VIDEO SECTION FUNCTIONALITY

const videoDialog = document.getElementById("videoDialog");
const videoPlayer = document.getElementById("videoPlayer");
const closeVideo = document.getElementById("closeVideo");
const nextVideo = document.getElementById("nextVideo");
const previousVideo = document.getElementById("previousVideo");
const videoPosition = document.getElementById("videoPosition");

const commentDialog = document.getElementById("commentDialog");
const closeComments = document.getElementById("closeComments");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");

let currentCategory = [];
let currentVideoIndex = 0;
let currentCommentVideo = "";


// GET VIDEO INFORMATION FROM HTML

function getVideoCards() {
  return [...document.querySelectorAll(".video-card")];
}

function getVideoSource(card) {
  return card?.querySelector("video source")?.getAttribute("src") || "";
}

function getCategoryCards(card) {
  return [...card.closest(".video-category").querySelectorAll(".video-card")];
}


// UPDATE CATEGORY VIDEO COUNTS

document.querySelectorAll(".video-category").forEach(category => {
  const count = category.querySelectorAll(".video-card").length;
  const countLabel = category.querySelector(".video-count");

  if (countLabel) {
    countLabel.textContent = `${count} VIDEOS`;
  }
});


// CREATE STILL VIDEO THUMBNAILS

function createVideoThumbnail(video) {
  const preview = video.closest(".video-preview");

  if (!preview || preview.querySelector(".video-thumbnail")) return;

  const canvas = document.createElement("canvas");
  canvas.className = "video-thumbnail";
  canvas.setAttribute("aria-hidden", "true");

  preview.insertBefore(canvas, video);

  const context = canvas.getContext("2d");
  let frameDrawn = false;

  function drawFrame() {
    if (
      frameDrawn ||
      !context ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    const box = preview.getBoundingClientRect();

    const width = Math.max(320, Math.round(box.width || 640));
    const height = Math.max(200, Math.round(box.height || 400));

    canvas.width = width;
    canvas.height = height;

    const videoRatio = video.videoWidth / video.videoHeight;
    const previewRatio = width / height;

    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;

    if (videoRatio > previewRatio) {
      sw = video.videoHeight * previewRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / previewRatio;
      sy = (video.videoHeight - sh) / 2;
    }

    try {
      context.drawImage(
        video,
        sx, sy, sw, sh,
        0, 0, width, height
      );

      frameDrawn = true;
      video.pause();
      video.preload = "metadata";

    } catch (error) {
      console.warn("Could not create video thumbnail:", error);
    }
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  video.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      const previewTime = Math.min(video.duration * 0.2, 2.5);

      try {
        video.currentTime = previewTime;
      } catch (error) {
        console.warn("Could not seek to preview frame:", error);
      }
    }
  }, { once: true });

  video.addEventListener("seeked", drawFrame, { once: true });

  video.addEventListener("error", () => {
    canvas.remove();
    preview.classList.add("preview-unavailable");

    const message = document.createElement("span");
    message.className = "preview-message";
    message.textContent = "Preview unavailable";

    preview.appendChild(message);
  }, { once: true });

  video.preload = "auto";
  video.load();
}


// LOAD THUMBNAILS WHEN CARDS APPROACH THE SCREEN

const previewObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const video = entry.target;

    createVideoThumbnail(video);
    previewObserver.unobserve(video);
  });
}, {
  rootMargin: "300px"
});

document.querySelectorAll(".video-preview video").forEach(video => {
  video.preload = "metadata";
  previewObserver.observe(video);
});


// MAIN VIDEO PLAYER

function openVideo(card) {
  currentCategory = getCategoryCards(card);
  currentVideoIndex = currentCategory.indexOf(card);

  if (!videoDialog.open) {
    videoDialog.showModal();
  }

  playCurrentVideo();
}

function playCurrentVideo() {
  const card = currentCategory[currentVideoIndex];

  if (!card) return;

  const source = getVideoSource(card);

  videoPlayer.pause();
  videoPlayer.src = source;
  videoPlayer.load();

  videoPlayer.play().catch(() => {
    console.log("Video could not play. Check the video file path.");
  });

  videoPosition.textContent =
    `VIDEO ${currentVideoIndex + 1} / ${currentCategory.length}`;

  previousVideo.disabled = currentVideoIndex === 0;
  nextVideo.disabled = currentVideoIndex === currentCategory.length - 1;
}


// NEXT AND PREVIOUS

function goToNextVideo() {
  if (currentVideoIndex < currentCategory.length - 1) {
    currentVideoIndex++;
    playCurrentVideo();
  }
}

function goToPreviousVideo() {
  if (currentVideoIndex > 0) {
    currentVideoIndex--;
    playCurrentVideo();
  }
}

nextVideo.addEventListener("click", goToNextVideo);
previousVideo.addEventListener("click", goToPreviousVideo);


// AUTOMATICALLY PLAY NEXT VIDEO

videoPlayer.addEventListener("ended", () => {
  if (currentVideoIndex < currentCategory.length - 1) {
    goToNextVideo();
  }
});


// CLOSE VIDEO PLAYER

function closeVideoPlayer() {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  if (videoDialog.open) {
    videoDialog.close();
  }
}

closeVideo.addEventListener("click", closeVideoPlayer);

videoDialog.addEventListener("click", event => {
  if (event.target === videoDialog) {
    closeVideoPlayer();
  }
});


// KEYBOARD NAVIGATION

document.addEventListener("keydown", event => {
  if (!videoDialog.open || commentDialog.open) return;

  if (event.key === "ArrowRight") {
    goToNextVideo();
  }

  if (event.key === "ArrowLeft") {
    goToPreviousVideo();
  }
});


// SAVE AND LOAD LIKES

function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem("oopsieLikes")) || {};
  } catch {
    return {};
  }
}

function saveLikes(likes) {
  try {
    localStorage.setItem("oopsieLikes", JSON.stringify(likes));
  } catch {
    console.log("Likes could not be saved.");
  }
}

const likes = loadLikes();


// RESTORE SAVED LIKES

getVideoCards().forEach(card => {
  const source = getVideoSource(card);
  const button = card.querySelector(".like-btn");

  if (likes[source]) {
    button.classList.add("liked");
    button.innerHTML = "♥ <span>Liked</span>";
  }
});


// VIDEO CARD INTERACTIONS

document.querySelector(".video-categories").addEventListener("click", event => {
  const card = event.target.closest(".video-card");

  if (!card) return;

  // Like button
  const likeButton = event.target.closest(".like-btn");

  if (likeButton) {
    const source = getVideoSource(card);

    if (likes[source]) {
      delete likes[source];

      likeButton.classList.remove("liked");
      likeButton.innerHTML = "♡ <span>Like</span>";

    } else {
      likes[source] = true;

      likeButton.classList.add("liked");
      likeButton.innerHTML = "♥ <span>Liked</span>";
    }

    saveLikes(likes);
    return;
  }

  // Comment button
  if (event.target.closest(".comment-btn")) {
    openComments(card);
    return;
  }

  // Share button
  if (event.target.closest(".share-btn")) {
    shareVideo(card);
    return;
  }

  // Play button or video preview
  if (event.target.closest(".video-preview")) {
    openVideo(card);
  }
});


// SHARE VIDEO

async function shareVideo(card) {
  const category = card.closest(".video-category");
  const title = category.querySelector("h3").textContent.trim();

  const shareData = {
    title: "OOPSIE CORNER",
    text: `Check out this funny video from ${title}!`,
    url: window.location.href.split("#")[0] + "#" + category.id
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);

    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      alert("Video section link copied!");

    } else {
      alert("Sharing is not supported in this browser.");
    }

  } catch (error) {
    if (error.name !== "AbortError") {
      alert("Could not share this video.");
    }
  }
}


// SAVE AND LOAD COMMENTS

function loadComments() {
  try {
    return JSON.parse(localStorage.getItem("oopsieComments")) || {};
  } catch {
    return {};
  }
}

function saveComments(comments) {
  try {
    localStorage.setItem("oopsieComments", JSON.stringify(comments));
  } catch {
    alert("Comments could not be saved.");
  }
}


// OPEN COMMENTS

function openComments(card) {
  currentCommentVideo = getVideoSource(card);

  commentInput.value = "";
  displayComments();

  if (!commentDialog.open) {
    commentDialog.showModal();
  }
}


// DISPLAY COMMENTS

function displayComments() {
  const comments = loadComments();
  const videoComments = comments[currentCommentVideo] || [];

  commentList.innerHTML = "";

  if (videoComments.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "comment-empty";
    emptyMessage.textContent =
      "No comments yet. Be the first to say something!";

    commentList.appendChild(emptyMessage);
    return;
  }

  videoComments.forEach(comment => {
    const item = document.createElement("div");

    item.className = "comment-item";
    item.textContent = comment;

    commentList.appendChild(item);
  });
}


// POST A COMMENT

commentForm.addEventListener("submit", event => {
  event.preventDefault();

  const message = commentInput.value.trim();

  if (!message) return;

  const comments = loadComments();

  if (!comments[currentCommentVideo]) {
    comments[currentCommentVideo] = [];
  }

  comments[currentCommentVideo].push(message);

  saveComments(comments);

  commentInput.value = "";
  displayComments();
});


// CLOSE COMMENTS

closeComments.addEventListener("click", () => {
  commentDialog.close();
});

commentDialog.addEventListener("click", event => {
  if (event.target === commentDialog) {
    commentDialog.close();
  }
});

// Current year in footer.
document.getElementById("year").textContent = new Date().getFullYear();

const videoSearch = document.getElementById("videoSearch");
const clearSearch = document.getElementById("clearSearch");

videoSearch.addEventListener("input", function () {
  const searchValue = videoSearch.value.toLowerCase().trim();

  const categories = document.querySelectorAll(".video-category");

  categories.forEach(category => {
    const heading = category.querySelector("h3");
    const categoryName = heading ? heading.textContent.toLowerCase() : "";

    const cards = category.querySelectorAll(".video-card");
    let visibleCards = 0;

    cards.forEach(card => {
      const cardText = card.textContent.toLowerCase();

      const matches =
        categoryName.includes(searchValue) ||
        cardText.includes(searchValue);

      card.classList.toggle("search-hidden", !matches);

      if (matches) {
        visibleCards++;
      }
    });

    category.classList.toggle(
      "search-hidden",
      visibleCards === 0
    );
  });
});

clearSearch.addEventListener("click", function () {
  videoSearch.value = "";

  videoSearch.dispatchEvent(new Event("input"));

  videoSearch.focus();
});

// OOPSIE IMAGE VIEWER

const mosaicTiles = document.querySelectorAll(".mosaic-tile");

const imageDialog = document.getElementById("imageDialog");
const fullImage = document.getElementById("fullImage");
const imageCounter = document.getElementById("imageCounter");

const imageClose = document.getElementById("imageClose");
const imageNext = document.getElementById("imageNext");
const imagePrev = document.getElementById("imagePrev");

// Get all mosaic images
const mosaicImages = Array.from(mosaicTiles).map(tile => {
  return {
    src: tile.querySelector("img").src,
    alt: tile.querySelector("img").alt
  };
});

let currentImage = 0;

// Display selected image
function showMosaicImage(index) {

  currentImage = (index + mosaicImages.length) % mosaicImages.length;

  fullImage.src = mosaicImages[currentImage].src;
  fullImage.alt = mosaicImages[currentImage].alt;

  imageCounter.textContent =
    `${currentImage + 1} / ${mosaicImages.length}`;
}

// Open image when clicked
mosaicTiles.forEach((tile, index) => {

  tile.addEventListener("click", function(event) {

    event.preventDefault();

    showMosaicImage(index);

    imageDialog.showModal();

  });

});

// Next image
imageNext.addEventListener("click", function() {
  showMosaicImage(currentImage + 1);
});

// Previous image
imagePrev.addEventListener("click", function() {
  showMosaicImage(currentImage - 1);
});

// Close image viewer
imageClose.addEventListener("click", function() {
  imageDialog.close();
});

// Close when clicking outside the image
imageDialog.addEventListener("click", function(event) {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});

// Keyboard navigation
document.addEventListener("keydown", function(event) {

  if (!imageDialog.open) return;

  if (event.key === "ArrowRight") {
    showMosaicImage(currentImage + 1);
  }

  if (event.key === "ArrowLeft") {
    showMosaicImage(currentImage - 1);
  }

});