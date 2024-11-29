// src/app.js
import { Auth, getUser } from './auth';
import { getUserFragments, saveUserFragment, getUserFragment, getUserFragmentById, updateFragmentExtension, deleteFragmentById } from './api';

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
      console.log("2222222222222222");
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
      // First, fetch fragment metadata
      const fragmentData = await getUserFragmentById(user, id);
      console.log('Fragment metadata:', fragmentData);

      // Then, fetch fragment content
      const fragmentContent = await getUserFragment(user, id);
      console.log('Fragment content:', fragmentContent);

      // Clear previous status and details
      fragmentStatus.innerHTML = "";
      fragmentDetailsBody.innerHTML = '';

      // Create a row to display the fragment content first
      const contentRow = document.createElement('tr');

      // Safely display content based on fragment type
      let displayContent;
      if (fragmentData.fragment.type === 'application/json') {
        try {
          // Pretty print JSON if it's a JSON fragment
          displayContent = JSON.stringify(JSON.parse(fragmentContent), null, 2);
        } catch {
          // If JSON parsing fails, display as is
          displayContent = fragmentContent;
        }
      } else if (fragmentData.fragment.type.startsWith('image/')) {
        // For image fragments, create an img element
        displayContent = `<img src="data:${fragmentData.fragment.type};base64,${fragmentContent}" alt="Fragment Image" style="max-width: 300px;">`;
      } else {
        // For non-JSON fragments, display content as is
        displayContent = fragmentContent;
      }

      contentRow.innerHTML = `<td>Content</td><td>${displayContent}</td>`;
      fragmentDetailsBody.appendChild(contentRow);

      // Then display fragment metadata
      for (const [key, value] of Object.entries(fragmentData.fragment)) {
        // Skip adding the content again
        if (key !== 'id') {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${value}</td>`;
          fragmentDetailsBody.appendChild(row);
        }
      }

      // Make the fragment details visible
      fragmentDetails.hidden = false;
    } catch (error) {
      console.error("Full error fetching fragment:", error);

      if (error.message) {
        fragmentStatus.innerHTML = `Failed to fetch fragment details: ${error.message}`;
      } else {
        fragmentStatus.innerHTML = "Failed to fetch fragment details.";
      }

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

  // Update file handling functions
  const handleFileUpload = async (file) => {
    const fragmentType = file.type;
    const supportedTypes = [
      'text/plain', 'text/plain; charset=utf-8', 
      'text/markdown', 'text/html', 'text/csv', 
      'application/json', 'application/yaml', 
      'image/png', 'image/jpeg', 'image/webp', 
      'image/avif', 'image/gif'
    ];

    if (!supportedTypes.includes(fragmentType)) {
      fragmentStatus.innerHTML = "Unsupported file type.";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      let fragmentData = e.target.result;

      // For image files, we want to use the base64 data URL directly
      if (fragmentType.startsWith('image/')) {
        // Remove the data URL prefix to send just the base64 data
        fragmentData = fragmentData.split(',')[1];
      }

      try {
        await saveUserFragment(user, fragmentType, fragmentData);
        console.log("1333333333333333333333");
        fragmentStatus.innerHTML = "Fragment created successfully.";
        await displayFragments();
      } catch (error) {
        fragmentStatus.innerHTML = "Failed to create fragment.";
        console.error("Error creating fragment:", error);
      }
    };

    // Use readAsDataURL for image files, readAsText for text-based files
    if (fragmentType.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      fragmentStatus.innerHTML = "No file selected.";
      return;
    }

    await handleFileUpload(file);
  });

  const handleUpdateClick = async (fragmentId) => {
    // Existing handleUpdateClick code remains the same
    try {
      // Fetch fragment metadata
      const fragmentData = await getUserFragmentById(user, fragmentId);
      const fragment = fragmentData.fragment;

      // Fetch actual fragment content
      const fragmentContent = await getUserFragment(user, fragmentId);

      // Create and display the update modal
      const updateModal = document.createElement('div');
      updateModal.className = 'update-modal';

      // Display content safely based on fragment type
      let displayContent;
      if (fragment.type === 'application/json') {
        try {
          displayContent = JSON.stringify(JSON.parse(fragmentContent), null, 2);
        } catch {
          displayContent = fragmentContent;
        }
      } else if (fragment.type.startsWith('image/')) {
        // For image fragments, create an img element
        displayContent = `<img src="data:${fragment.type};base64,${fragmentContent}" alt="Fragment Image" style="max-width: 300px;">`;
      } else {
        displayContent = fragmentContent;
      }

      // Modal HTML content
      updateModal.innerHTML = `
      <div class="update-modal-content">
        <h2>Update Fragment</h2>
        <div class="fragment-content-section">
          <h3>Fragment Content</h3>
          <pre class="fragment-content">${displayContent}</pre>
        </div>
        <p>Fragment ID: ${fragment.id}</p>
        <p>Current Type: ${fragment.type}</p>
        <label id="newExtensionText" for="newExtension">New Extension:</label>
        <input type="text" id="newExtension" placeholder="Enter new extension (e.g., txt, md, html)">
        <div id="extensionMessage" class="error-message"></div>
        <button id="changeExtBtn">Change Extension</button>
        <button id="downloadFragBtn">Download Fragment</button>
        <button id="deleteFragBtn">Delete Fragment</button>
        <button id="closeModalBtn">Close</button>
      </div>
    `;

      document.body.appendChild(updateModal);

      // Add event listeners for buttons
      document.getElementById('changeExtBtn').addEventListener('click', () => changeExtension(fragment.id));
      document.getElementById('downloadFragBtn').addEventListener('click', () => downloadFragment(fragment.id));
      document.getElementById('closeModalBtn').addEventListener('click', () => updateModal.remove());
      document.getElementById('deleteFragBtn').addEventListener('click', () => {
        deleteFragment(fragment.id).then(() => {
          // Hide buttons and inputs after deletion
          ['changeExtBtn', 'downloadFragBtn', 'deleteFragBtn', 'newExtensionText', 'newExtension']
            .forEach(id => document.getElementById(id)?.remove());
        });
      });
    } catch (error) {
      console.error('Error fetching fragment details:', error);
      document.getElementById('fragmentStatus').innerHTML = "Failed to load fragment details.";
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
      // First, fetch the fragment metadata
      const fragmentData = await getUserFragmentById(user, fragmentId);
      if (!fragmentData || !fragmentData.fragment) {
        console.error('Failed to retrieve fragment data');
        return;
      }

      const fragment = fragmentData.fragment;
      const fragmentType = fragment.type;

      // Fetch the actual fragment content
      const fragmentContent = await getUserFragment(user, fragmentId);

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
        case 'text/plain; charset=utf-8':
          fileExtension = '.txt';
          break;
        case 'text/html':
          fileExtension = '.html';
          break;
        case 'image/png':
          fileExtension = '.png';
          break;
        case 'image/jpeg':
          fileExtension = '.jpg';
          break;
        case 'image/webp':
          fileExtension = '.webp';
          break;
        case 'image/avif':
          fileExtension = '.avif';
          break;
        case 'image/gif':
          fileExtension = '.gif';
          break;
        default:
          console.warn('Unsupported fragment type. Defaulting to .txt');
          fileExtension = '.txt';
      }


      // Convert content to a Blob
      const blob = new Blob([fragmentContent], { type: fragmentType });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element for download
      const a = document.createElement('a');
      a.href = url;
      a.download = `fragment_${fragmentId}${fileExtension}`;

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
      const arrayBuffer = e.target.result;
      const fragmentType = file.type;

      try {
        await saveUserFragment(user, fragmentType, arrayBuffer);
        console.log("444444444444444444444");
        fragmentStatus.innerHTML = "Fragment created successfully.";
        await displayFragments();
      } catch (error) {
        fragmentStatus.innerHTML = "Failed to create fragment.";
        console.error("Error creating fragment:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  // fileInput.addEventListener('change', async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) {
  //     fragmentStatus.innerHTML = "No file selected.";
  //     return;
  //   }

  //   const fragmentType = file.type;
  //   if (!['text/plain', 'text/plain; charset=utf-8', 'text/markdown', 'text/html', 'text/csv', 'application/json', 'application/yaml', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(fragmentType)) {
  //     fragmentStatus.innerHTML = "Unsupported file type.";
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = async (e) => {
  //     const arrayBuffer = e.target.result;
  //     const fragmentType = file.type;

  //     try {
  //       await saveUserFragment(user, fragmentType, arrayBuffer);
  //       console.log("1111111111111111111111");
  //       fragmentStatus.innerHTML = "Fragment created successfully.";
  //       await displayFragments();
  //     } catch (error) {
  //       fragmentStatus.innerHTML = "Failed to create fragment.";
  //       console.error("Error creating fragment:", error);
  //     }
  //   };
  //   reader.readAsArrayBuffer(file);
  // });
}

window.onload = init;