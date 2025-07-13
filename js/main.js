let currentPage = 1;

const textContainer = document.getElementById("text-container");
const audio = new Audio();
const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");

function loadPage(pageNumber) {
  fetch(`pages/page${pageNumber}.txt`)
    .then((response) => {
      if (!response.ok) throw new Error("Page not found");
      return response.text();
    })
    .then((text) => {
      textContainer.textContent = text;
      currentPage = pageNumber;
      playAudio(currentPage);
    })
    .catch((err) => {
      console.error(err);
      textContainer.textContent = "Page not found.";
    });
}

function playAudio(pageNumber) {
  audio.src = `audio/page${pageNumber}.mp3`;
  audio.onerror = () => {
    console.error("❌ Audio failed to load:", audio.src);
    alert("Audio failed to load. Please check if audio/page" + pageNumber + ".mp3 exists.");
  };
  audio.oncanplay = () => {
    audio.play().catch((err) => console.error("Audio play error:", err));
  };
}

// Navigation buttons
document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentPage > 1) loadPage(currentPage - 1);
});

document.getElementById("nextBtn").addEventListener("click", () => {
  loadPage(currentPage + 1);
});

// Manual audio upload
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type === "audio/mpeg") {
    const fileURL = URL.createObjectURL(file);
    audio.src = fileURL;
    audio.play();
  } else {
    alert("Please upload a valid MP3 file.");
  }
});

// Optional: Drag & Drop support
if (dropZone) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragging");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    const file = e.dataTransfer.files[0];
    if (file && file.type === "audio/mpeg") {
      const fileURL = URL.createObjectURL(file);
      audio.src = fileURL;
      audio.play();
    } else {
      alert("Only MP3 files are supported.");
    }
  });
}

// Load first page
loadPage(currentPage);
