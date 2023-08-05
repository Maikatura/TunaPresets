// script.js
let isUpdateInProgress = false;
let currentData = null;

const coverImage = document.getElementById('coverImage');
const title = document.getElementById('title');
const artists = document.getElementById('artists');
const album = document.getElementById('album');
const coverContainer = document.querySelector('.cover-container');
const coverBackground = document.querySelector('.cover-background');

const nowPlaying = document.querySelector('.now-playing');
const updateDuration = 1000; // Duration for scaling transitions in milliseconds

const scaleBox = (scale) => {
    nowPlaying.style.transition = `transform ${updateDuration}ms ease-in-out`;
    nowPlaying.style.transform = `scale(${scale})`;
};


// Fetch and update the Now Playing data with animation

const slideOutCover = () => {
    coverImage.style.transform = 'translateX(-150%)';
};

const slideInCover = () => {
    coverImage.style.transform = 'translateX(0)';
};

const updateNowPlaying = (data) => {
  
    
        // Update the cover and Now Playing information
        coverImage.src = data.cover_path;
        title.textContent = data.title;
        artists.textContent = data.artists.join(', ');


        // Slide the cover back into place
        slideInCover();
		updateCoverBackground(data.cover_path);

        // Update the current data and reset the flag
        currentData = data;
   

};



const updateCoverBackground = (imageUrl) => {
    coverBackground.style.backgroundImage = `url(${imageUrl})`;
};

const isSameData = (data1, data2) => {
    if (!data1 || !data2) {
        return false; // One of the objects is null, not the same
    }

    // Compare the properties of both objects
    return (
        JSON.stringify(data1.artists) === JSON.stringify(data2.artists) &&
        data1.cover_path === data2.cover_path &&
        data1.title === data2.title
        // Add other properties for comparison if needed
    );
};


const updateNowPlayingDataWithAnimation = (data) => {
    if (isUpdateInProgress) return;

    if (isSameData(data, currentData)) {
        // Data has not changed, no update needed
        return;
    }
    isUpdateInProgress = true;

    // Scale the box to 0
    scaleBox(0);

    // Wait for the scaling animation to finish
    setTimeout(() => {
        // Update the cover background and Now Playing information
        updateNowPlaying(data);

        // Scale the box back to 1
        scaleBox(1);

        // Update the current data and reset the flag
        currentData = data;
        isUpdateInProgress = false;
    }, updateDuration);
};

const updateNowPlayingData = () => {
    fetch('http://localhost:1608')
        .then(response => response.json())
        .then(data => {
            updateNowPlayingDataWithAnimation(data);
        })
        .catch(error => {
            console.error('Error fetching Now Playing data:', error);
            // Reset the flag in case of an error
            isUpdateInProgress = false;
        });
};



updateNowPlayingData();


// Periodically update the Now Playing data every 5 seconds
setInterval(updateNowPlayingData, 2000);
