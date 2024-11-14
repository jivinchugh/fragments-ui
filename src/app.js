// src/app.js
import { Auth, getUser } from './auth';
import { getUserFragments, saveUserFragment, getUserFragmentById, updateFragmentExtension, deleteFragmentById } from './api';

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
          <td><button class="update-btn" data-id="${fragment.id}">Update</button></td>
          `;
        fragmentTableBody.appendChild(row);
      });

      // Add event listeners to the "Get Info" and "Update" buttons
      document.querySelectorAll('.get-info-btn').forEach(button => {
        button.onclick = () => fetchFragmentById(button.dataset.id);
      });
      document.querySelectorAll('.update-btn').forEach(button => {
        button.onclick = () => handleUpdateClick(button.dataset.id);
      });
    } else {
      fragmentTableBody.innerHTML = '<tr><td colspan="7">No fragments available.</td></tr>';
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
    fragmentIdInput.value = id;
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

  // New function to handle update button click
  const handleUpdateClick = async (fragmentId) => {
    try {
      const fragmentData = await getUserFragmentById(user, fragmentId);
      const fragment = fragmentData.fragment;

      // Create and show the update modal
      const updateModal = document.createElement('div');
      updateModal.className = 'update-modal';
      updateModal.innerHTML = `
        <div class="update-modal-content">
          <h2>Update Fragment</h2>
          <p>Fragment ID: ${fragment.id}</p>
          <p>Current Type: ${fragment.type}</p>
          <label id="newExtensionText" for="newExtension">New Extension:</label>
          <input type="text" id="newExtension" placeholder="Enter new extension (e.g., txt, md, html)">
          <div id="extensionMessage" style="color: red;"></div>
          <button id="changeExtBtn">Change Extension</button>
          <button id="downloadFragBtn">Download Fragment</button>
          <button id="deleteFragBtn">Delete Fragment</button>
          <button id="closeModalBtn">Close</button>
        </div>
      `;

      document.body.appendChild(updateModal);

      // Add event listeners for the buttons
      document.getElementById('changeExtBtn').addEventListener('click', () => changeExtension(fragment.id));
      document.getElementById('downloadFragBtn').addEventListener('click', () => downloadFragment(fragment.id));
      document.getElementById('closeModalBtn').addEventListener('click', () => updateModal.remove());
      document.getElementById('deleteFragBtn').addEventListener('click', () => {
        deleteFragment(fragment.id)
          .then(() => {
            // Hide or remove specific buttons after deletion
            const changeExtBtn = document.getElementById('changeExtBtn');
            const downloadFragBtn = document.getElementById('downloadFragBtn');
            const deleteFragBtn = document.getElementById('deleteFragBtn');

            if (newExtensionText) newExtensionText.style.display = 'none';
            if (newExtension) newExtension.style.display = 'none';
            if (changeExtBtn) changeExtBtn.style.display = 'none';
            if (changeExtBtn) changeExtBtn.style.display = 'none';
            if (downloadFragBtn) downloadFragBtn.style.display = 'none';
            if (deleteFragBtn) deleteFragBtn.style.display = 'none';

          });
      });
    } catch (error) {
      console.error('Error fetching fragment details:', error);
      fragmentStatus.innerHTML = "Failed to load fragment details.";
    }
  };

  // Function to change the extension
  const changeExtension = async (fragmentId) => {
    const newExt = document.getElementById('newExtension').value.trim();
    const messageDiv = document.getElementById('extensionMessage');
    console.log('New extension:', newExt);

    if (!newExt) {
      messageDiv.innerHTML = 'Please enter a new extension';
      return;
    }

    // Prepend a dot if it doesn't exist
    const formattedExt = newExt.startsWith('.') ? newExt : `.${newExt}`;

    try {
      // Update the extension on the server
      await updateFragmentExtension(user, fragmentId, formattedExt);
      messageDiv.style.color = 'green';
      messageDiv.innerHTML = 'Extension updated successfully';

      // Re-fetch the updated fragment data
      const updatedFragmentData = await getUserFragmentById(user, fragmentId);
      const updatedFragment = updatedFragmentData.fragment;

      // Update the modal with the new type
      const currentTypeElement = document.querySelector('.update-modal-content p:nth-child(3)');
      if (currentTypeElement) {
        currentTypeElement.innerText = `Current Type: ${updatedFragment.type}`;
      }

      await displayFragments();
    } catch (error) {
      console.error('Error updating extension:', error);
      messageDiv.style.color = 'red';
      messageDiv.innerHTML = 'Failed to update extension';
    }
  };


  // Function to download the fragment
  const downloadFragment = async (fragmentId) => {
    try {
      // Fetch the fragment data by ID
      const fragmentData = await getUserFragmentById(user, fragmentId);
      if (!fragmentData || !fragmentData.fragment) {
        console.error('Failed to retrieve fragment data');
        return;
      }

      const fragment = fragmentData.fragment;
      const fragmentType = fragment.type; // Assuming the type is stored in `fragment.type`

      // Determine the file extension based on the fragment type
      let fileExtension;
      switch (fragmentType) {
        case 'text/markdown':
          fileExtension = '.md';
          break;
        case 'application/json':
          fileExtension = '.json';
          break;
        case 'text/plain':
          fileExtension = '.txt';
          break;
        case 'text/plain; charset=utf-8':
          fileExtension = '.txt';
          break;
        case 'text/html':
          fileExtension = '.html';
          break;
        // Add more cases for other types as necessary
        default:
          console.warn('Unsupported fragment type. Defaulting to .txt');
          fileExtension = '.txt'; // Fallback extension
      }

      // Convert content to a Blob (adjust MIME type if needed)
      const blob = new Blob([fragment], { type: fragmentType });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element for download
      const a = document.createElement('a');
      a.href = url;
      a.download = `fragment_${fragmentId}${fileExtension}`; // Set the file name with the correct extension

      // Append the anchor to the body (needed for some browsers)
      document.body.appendChild(a);
      a.click(); // Trigger the download
      document.body.removeChild(a); // Clean up

      // Revoke the blob URL to free memory
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading fragment:', error);
    }
  };


  // Function to delete the fragment
  const deleteFragment = async (fragmentId) => {
    const messageDiv = document.getElementById('extensionMessage');
    const updateModal = document.querySelector('.update-modal');
    console.log("Delete fragment function triggered");
    try {
      await deleteFragmentById(user, fragmentId);
      messageDiv.innerHTML = 'Deleted fragment successfully';
      fragmentStatus.innerHTML = "";
      await displayFragments();
      return true;
    } catch (error) {
      fragmentStatus.innerHTML = "Failed to delete fragment.";
      console.error("Error deleting fragment:", error);
      return false;
    }
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
    if (!['text/plain', 'text/plain; charset=utf-8', 'text/markdown', 'text/html', 'text/csv', 'application/json', 'application/yaml', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(fragmentType)) {
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
    if (!['text/plain', 'text/plain; charset=utf-8', 'text/markdown', 'text/html', 'text/csv', 'application/json', 'application/yaml', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(fragmentType)) {
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

window.onload = init;
