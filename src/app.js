// src/app.js
import { Auth, getUser } from './auth';
import { getUserFragments, saveUserFragment, getUserFragmentById } from './api';

async function init() {
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
  const fragmentTableBody = document.querySelector('#fragmentTableBody');
  const fragmentTypeSelector = document.querySelector('#fragmentType');
  const dropArea = document.querySelector('#drop-area');
  const fileInput = document.querySelector('#fileInput');

  loginBtn.onclick = () => Auth.federatedSignIn();
  logoutBtn.onclick = () => Auth.signOut();

  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    return;
  }

  console.log({ user });

  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  // Load and display existing user fragments in a table
  const displayFragments = async () => {
    const userFragments = await getUserFragments(user);
    fragmentTableBody.innerHTML = '';
  
    if (userFragments && userFragments.fragments.length) {
      // Sort fragments by created date in descending order
      userFragments.fragments.sort((a, b) => new Date(b.created) - new Date(a.created));
  
      userFragments.fragments.forEach(fragment => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${fragment.id}</td>
          <td>${fragment.type}</td>
          <td>${new Date(fragment.created).toLocaleString()}</td>
          <td>${new Date(fragment.updated).toLocaleString()}</td>
          <td>${fragment.size}</td>
          <td><button class="get-info-btn" data-id="${fragment.id}">Get Info</button></td>
        `;
        fragmentTableBody.appendChild(row);
      });
  
      // Add event listeners to the "Get Info" buttons
      document.querySelectorAll('.get-info-btn').forEach(button => {
        button.onclick = () => fetchFragmentById(button.dataset.id);
      });
    } else {
      fragmentTableBody.innerHTML = '<tr><td colspan="6">No fragments available.</td></tr>';
    }
  };
  
  await displayFragments();

  createFragmentBtn.onclick = async () => {
    const textValue = fragmentText.value.trim();
    const fragmentType = fragmentTypeSelector.value;

    if (!textValue) {
      fragmentStatus.innerHTML = "Please enter some content to create a fragment.";
      return;
    }

    let formattedValue;
    console.log({ textValue });
    console.log({ fragmentType });
    if (fragmentType === 'application/json') {
        try {
            formattedValue = JSON.parse(textValue);
        } catch (e) {
            fragmentStatus.innerHTML = "Invalid JSON format.";
            return;
        }
    } else {
        // For other fragment types, use `textValue` directly
        formattedValue = textValue;
    }

    try {
      await saveUserFragment(user, fragmentType, textValue);
      fragmentStatus.innerHTML = "Fragment created successfully.";
      fragmentText.value = "";
      await displayFragments();
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to create fragment.";
      console.error("Error creating fragment:", error);
    }
  };

  const fetchFragmentById = async (id) => {
    fragmentIdInput.value = id; // Set input value to the clicked fragment ID for user reference
    try {
      const fragmentData = await getUserFragmentById(user, id);
      fragmentStatus.innerHTML = "";
      fragmentDetailsBody.innerHTML = '';
      for (const [key, value] of Object.entries(fragmentData.fragment)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        fragmentDetailsBody.appendChild(row);
      }
      fragmentDetails.hidden = false;
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to fetch fragment details.";
      console.error("Error fetching fragment:", error);
      fragmentDetails.hidden = true;
    }
  };

  fetchFragmentBtn.onclick = async () => {
    const idValue = fragmentIdInput.value.trim();
    if (!idValue) {
      fragmentStatus.innerHTML = "Please enter a fragment ID.";
      fragmentDetails.hidden = true;
      return;
    }
    await fetchFragmentById(idValue);
  };

  // Drag and Drop Area Event Handlers
  dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('dragover');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
  });

  dropArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropArea.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (!file) {
      fragmentStatus.innerHTML = "No file selected.";
      return;
    }

    const fragmentType = file.type;
    if (!['text/plain', 'text/markdown', 'text/html', 'text/csv', 'application/json'].includes(fragmentType)) {
      fragmentStatus.innerHTML = "Unsupported file type.";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textValue = e.target.result;
      try {
        await saveUserFragment(user, fragmentType, textValue);
        fragmentStatus.innerHTML = "Fragment created successfully.";
        await displayFragments();
      } catch (error) {
        fragmentStatus.innerHTML = "Failed to create fragment.";
        console.error("Error creating fragment:", error);
      }
    };
    reader.readAsText(file);
  });

  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      fragmentStatus.innerHTML = "No file selected.";
      return;
    }

    const fragmentType = file.type;
    if (!['text/plain', 'text/markdown', 'text/html', 'text/csv', 'application/json'].includes(fragmentType)) {
      fragmentStatus.innerHTML = "Unsupported file type.";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textValue = e.target.result;
      try {
        await saveUserFragment(user, fragmentType, textValue);
        fragmentStatus.innerHTML = "Fragment created successfully.";
        await displayFragments();
      } catch (error) {
        fragmentStatus.innerHTML = "Failed to create fragment.";
        console.error("Error creating fragment:", error);
      }
    };
    reader.readAsText(file);
  });
}

document.addEventListener('DOMContentLoaded', init);
