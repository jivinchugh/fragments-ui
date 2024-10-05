// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, saveUserFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createFragmentBtn = document.querySelector('#createFragment');
  const fragmentText = document.querySelector('#fragmentText');
  const fragmentStatus = document.querySelector('#fragmentStatus');

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

    // Ensure that only plain text is accepted
    if (!textValue) {
      fragmentStatus.innerHTML = "Please enter some text to create a fragment.";
      return;
    }

    // Save the fragment
    try {
      await saveUserFragment(user, 'text/plain', textValue);
      fragmentStatus.innerHTML = "Fragment created successfully: " + textValue;
      fragmentText.value = ""; // Clear the input after creation
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to create fragment.";
      console.error("Error creating fragment:", error);
    }
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
