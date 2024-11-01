// src/api.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL || 'http://localhost:8080';
console.log('API URL:', apiUrl);

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user, expand = false) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      method: "GET",
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

export async function saveUserFragment(user, typeofFragment, frag) {
  console.log('Sending data to create fragment...');
  console.log('Request URL:', `${apiUrl}/v1/fragments`);
  console.log('Request Headers:', {
    Authorization: `Bearer ${user.idToken}`,
    "Content-Type": `${typeofFragment}`,
  });
  console.log('Request Body:', frag);

  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.idToken}`,
        "Content-Type": `${typeofFragment}`,
      },
      body: `${frag}`,
    });

    console.log('Response Status:', res.status);
    console.log('Response Status Text:', res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.log('Response Error Text:', errorText);
      throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
    }

    const data = await res.json();
    console.log('Successfully created fragment with data -> ', { data });
    return data;
  } catch (err) {
    console.error("Error saving the fragment", { err });
    throw err;
  }
}

export async function getUserFragmentById(user, id) {
  console.log('Fetching fragment by ID:', id);
  if (!id) {
    throw new Error('Fragment ID is required');
  }
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}/info`, {
      method: 'GET',
      headers: user.authorizationHeaders(),
    });
    console.log('Response from API:', res); 

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully fetched fragment:', data);
    return data;
  } catch (err) {
    console.error('Error fetching fragment by ID:', err);
    throw err;
  }
}


export async function updateFragmentExtension(user, id, newExt) {
  console.log('Fetching fragment by ID and extension:', id, newExt);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}${newExt}`, {
      method: 'GET',
        headers: user.authorizationHeaders()
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Successfully fetched fragment:', data);
    return data;
  } catch (err) {
    console.error('Error fetching fragment:', err);
    throw err;
  }
}

