import { Auth, getUser } from './auth';
import { getUserFragments, saveUserFragment, getUserFragmentById } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createFragmentBtn = document.querySelector('#createFragment');
  const fragmentText = document.querySelector('#fragmentText');
  const fragmentStatus = document.querySelector('#fragmentStatus');
  const fetchFragmentBtn = document.querySelector('#fetchFragment');
  const fragmentIdInput = document.querySelector('#fragmentId'); 
  const fragmentDetails = document.querySelector('#fragmentDetails'); 
  const fragmentDetailsBody = document.querySelector('#fragment-details-body');

  // New element for content type selection
  const fragmentTypeSelector = document.querySelector('#fragmentType'); 

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    Auth.federatedSignIn();
  };

  logoutBtn.onclick = () => {
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  // Load existing user fragments
  const userFragments = await getUserFragments(user);
  console.log('User Fragments:', userFragments);

  // Functionality to create a new fragment
  createFragmentBtn.onclick = async () => {
    const textValue = fragmentText.value.trim();
    const fragmentType = fragmentTypeSelector.value; // Get the selected content type

    // Ensure that only plain text is accepted
    if (!textValue) {
      fragmentStatus.innerHTML = "Please enter some content to create a fragment.";
      return;
    }

    // If JSON is selected, validate JSON format
    if (fragmentType === 'application/json') {
      try {
        JSON.parse(textValue); // Attempt to parse as JSON to validate format
      } catch (e) {
        fragmentStatus.innerHTML = "Invalid JSON format.";
        return;
      }
    }

    try {
      await saveUserFragment(user, fragmentType, textValue); // Use the selected content type
      fragmentStatus.innerHTML = "Fragment created successfully: " + textValue;
      fragmentText.value = ""; // Clear the input field after success
      const updatedFragments = await getUserFragments(user);
      console.log('Updated User Fragments:', updatedFragments);
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to create fragment.";
      console.error("Error creating fragment:", error);
    }
  };

  // Event handler to fetch a fragment by ID
  fetchFragmentBtn.onclick = async () => {
    const idValue = fragmentIdInput.value.trim();

    if (!idValue) {
      fragmentStatus.innerHTML = "Please enter a fragment ID.";
      fragmentDetails.hidden = true; // Hide fragment details if no ID is provided
      return;
    }

    try {
      const fragmentData = await getUserFragmentById(user, idValue);
      fragmentStatus.innerHTML = ""; // Clear any previous status message
      
      // Clear previous table data
      fragmentDetailsBody.innerHTML = '';

      // Populate table with new fragment data
      for (const [key, value] of Object.entries(fragmentData.fragment)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        fragmentDetailsBody.appendChild(row);
      }

      fragmentDetails.hidden = false; // Show the fragment details section
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to fetch fragment details.";
      console.error("Error fetching fragment:", error);
      fragmentDetails.hidden = true; // Hide the fragment details on error
    }
  };
}

// Wait for the DOM to be ready, then initialize the app
document.addEventListener('DOMContentLoaded', init);
