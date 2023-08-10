// script.js
let isUpdateInProgress = false;
let currentData = null;

const urlParams = new URLSearchParams(window.location.search);

const body = document.getElementsByTagName("BODY")[0]; 
const coverImage = document.getElementById('coverImage');
const title = document.getElementById('title');
const artists = document.getElementById('artists');
const album = document.getElementById('album');
const coverContainer = document.querySelector('.cover-container');
const coverBackground = document.querySelector('.cover-background');

const nowPlaying = document.querySelector('.now-playing');
var updateDuration = 1000; // Duration for scaling transitions in milliseconds
var themePresets = urlParams.get('theme');

 // Store the starting position
let startX = nowPlaying.getBoundingClientRect().left;
let startY = nowPlaying.getBoundingClientRect().top;

// Store the current offset
let offsetX = 0;
let offsetY = 0;

const PlayChangeAnimation = (scale) => {
	
	const animationValue = urlParams.get('animation');
	
	
	if (animationValue !== null)
	{
		
		if (animationValue.toLowerCase() === "UpThenDown".toLowerCase())
		{
			  nowPlaying.style.transform = `translateY(${(1 - scale) * -200}%)`;
		}
		else if (animationValue.toLowerCase() === "DownThenUp".toLowerCase())
		{
			  nowPlaying.style.transform = `translateY(${(1 - scale) * 200}%)`;
		}
		else if (animationValue.toLowerCase() === "LeftThenRight".toLowerCase())
		{
			  nowPlaying.style.transform = `translateX(${(1 - scale) * -200}%)`;
		}
		else if (animationValue.toLowerCase() === "RightThenLeft".toLowerCase())
		{
			  nowPlaying.style.transform = `translateX(${(1 - scale) * 200}%)`;
		}
		else
		{
			 nowPlaying.style.transform = `scale(${scale})`;
		}
	}
	else
	{
		nowPlaying.style.transform = `scale(${scale})`;
	}
	nowPlaying.style.transition = `transform ${updateDuration}ms ease-in-out`;
};


// Fetch and update the Now Playing data with animation

const updateNowPlaying = (data) => {
  
  
	if (!data)
	{
		return;
	}
	
	// Update the cover and Now Playing information
	if (!data.cover_path)
	{
		return;
	}
	
	if (!data.title)
	{
		return;
	}
	
	if (!data.artists)
	{
		return;
	}
	
	
	coverImage.src = data.cover_path;
	title.textContent = data.title;
	artists.textContent = data.artists.join(', ');
	
	// Slide the cover back into place
	
	if (themePresets !== null)
	{
		if (themePresets.toLowerCase() === "Simple".toLowerCase())
		{
			updateCoverBackground("");
		}
		else
		{
			updateCoverBackground(data.cover_path);
		}
	}
	else
	{
		updateCoverBackground(data.cover_path);
	}

	
	// Update the current data and reset the flag
	
	

};



const updateCoverBackground = (imageUrl) => {
    coverBackground.style.backgroundImage = `url(${imageUrl})`;
};

const isSameData = (data1, data2) => {
    if (!data1 || !data2) 
	{
        return false; // One of the objects is null, not the same
    }
	
	if (!data1.artists || !data2.artists) 
	{
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

    if (isSameData(data, currentData)) 
	{
        // Data has not changed, no update needed
        return;
    }
	else
	{
		currentData = data;
	}
		
	
	if (!currentData.artists) 
	{
        // No new data available, do not update or animate
		PlayChangeAnimation(0);
        return;
    }
	
    isUpdateInProgress = true;

    // Scale the box to 0
    PlayChangeAnimation(0);

    // Wait for the scaling animation to finish
    setTimeout(() => {
       
	  
        updateNowPlaying(data);

        // Scale the box back to 1
        PlayChangeAnimation(1);

        // Update the current data and reset the flag
		
		
		
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

const updatePosition = () => {
	var position = urlParams.get('position');

	if (position !== null)
	{	
		if (position.toLowerCase() === "TopLeft".toLowerCase())
		{
			body.style.justifyContent = `flex-start`;
			body.style.alignItems = `flex-start`;
		}
		else if (position.toLowerCase() === "BottomLeft".toLowerCase())
		{
			body.style.justifyContent = `flex-start`;
			body.style.alignItems = `flex-end`;
		}
		else if (position.toLowerCase() === "CenterLeft".toLowerCase())
		{
			body.style.justifyContent = `flex-start`;
			body.style.alignItems = `center`;
		}
		else if (position.toLowerCase() === "TopRight".toLowerCase())
		{
			body.style.justifyContent = `flex-end`;
			body.style.alignItems = `flex-start`;
		}
		else if (position.toLowerCase() === "BottomRight".toLowerCase())
		{
			body.style.justifyContent = `flex-end`;
			body.style.alignItems = `flex-end`;
		}
		else if (position.toLowerCase() === "CenterRight".toLowerCase())
		{
			body.style.justifyContent = `flex-end`;
			body.style.alignItems = `center`;
		}
		else if (position.toLowerCase() === "TopCenter".toLowerCase())
		{
			body.style.justifyContent = `center`;
			body.style.alignItems = `flex-start`;
		}
		else if (position.toLowerCase() === "BottomCenter".toLowerCase())
		{
			body.style.justifyContent = `center`;
			body.style.alignItems = `flex-end`;
		}
		else if (position.toLowerCase() === "Center".toLowerCase())
		{
			body.style.justifyContent = `center`;
			body.style.alignItems = `center`;
		}
		else
		{
			body.style.justifyContent = `flex-start`;
			body.style.alignItems = `flex-start`;
		}
	}
	else
	{
			body.style.justifyContent = `flex-start`;
			body.style.alignItems = `flex-start`;
	}
	
	var durTime = urlParams.get('duration');
	if (durTime !== null)
	{
		updateDuration = durTime;
	}
	else
	{
		updateDuration = 1000;
	}	
	
};

updatePosition();
updateNowPlayingData();

// Periodically update the Now Playing data every 5 seconds
setInterval(updateNowPlayingData, 2500);
