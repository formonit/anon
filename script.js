import securelayEndpoint from 'https://cdn.jsdelivr.net/gh/securelay/api@main/script.js';

// Brief: Returns the first 5 hex chars from a v4 UUID as a unique string
function newVisitorID () {
  return crypto.randomUUID().substr(0, 5);
}

// Brief: Returns {formActionURL, visitorID} if ok, Booelan false otherwise.
async function validate () {
  const securelayAddrKey = decodeURIComponent(location.pathname.split('/').pop());
  const [securelayPubKey, securelayEndpointID] = securelayAddrKey.split('@');
  if (!(securelayPubKey && securelayEndpointID)) return false;

  try {
    const securelayEndpointURL = securelayEndpoint(securelayEndpointID)[0];
    const formActionURL = securelayEndpointURL + '/public/' + securelayPubKey;
    const cacheKey = ('visitorID@' + location.pathname);
    const oldVisitorID = localStorage.getItem(cacheKey);
    if (oldVisitorID) return { formActionURL, visitorID: oldVisitorID };

    const response = await fetch(formActionURL.replace('public', 'keys'));
    if (!response.ok) throw new Error(404);
    const type = await response.json().then((obj) => obj.type);
    if (type !== 'public') throw new Error(404);

    const visitorID = newVisitorID();
    localStorage.setItem(cacheKey, visitorID);
    submitNewView(formActionURL);
    return { formActionURL, visitorID };
  } catch (err) {
    return false;
  }
}

function logChat (msg, received = true) {
  const chatbox = document.getElementById('chatbox');
  const row = document.createElement('p');
  let sender = 'You';
  if (received) sender = 'Me';
  const entry = `${sender} @ ${Date().split(' ')[4]}: ${msg}`;
  row.append(entry);
  chatbox.prepend(row);
}

async function loadReply (chatURL) {
  return fetch(chatURL)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((data) => data.data.Message)
    .then((reply) => {
      logChat(reply);
    })
    .catch((err) => err.message);
}

async function geolocateByIP () {
  const apiEndpoint = 'https://ipapi.co/json/'; // 'http://ip-api.com/json/?fields=25';
  return fetch(apiEndpoint)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((obj) => [obj.country_name, obj.region, obj.city].join('/'))
    .catch((err) => '');
}

async function setupGeolocation (field) {
  const fallback = async (err) => {
    field.value = await geolocateByIP();
  };

  const byDevice = (position) => {
    field.value = position.coords.latitude + ',' + position.coords.longitude;
  };

  if (!navigator.geolocation || field.className.split(' ').includes('geolocate-by-ip')) {
    await fallback();
  } else {
    navigator.geolocation.getCurrentPosition(byDevice, fallback);
  }
}

async function setupForm (formActionURL, visitorID) {
  const contactForm = document.forms.contact;
  const checkImgURL = 'https://img.icons8.com/color/30/approval--v1.png';
  const crossImgURL = 'https://img.icons8.com/emoji/30/cross-mark-emoji.png';
  const query = `?app=formonit&ok=${encodeURIComponent(checkImgURL)}&err=${encodeURIComponent(crossImgURL)}`;
  contactForm.elements.ChatID.value = visitorID;
  contactForm.action = formActionURL + query;

  contactForm.addEventListener('submit', async (event) => {
    const thisForm = event.target;
    await loadReply(formActionURL + '/' + visitorID);
    const msg = thisForm.elements.Message.value;
    logChat(msg, false);
  });

  await setupGeolocation(contactForm.elements.Location);
}

function submitNewView (formActionURL) {
  const viewCounterForm = document.forms.viewCounter;
  viewCounterForm.action = formActionURL;
  viewCounterForm.submit();
}

async function init () {
  const { formActionURL, visitorID } = await validate();
  spaHide('loading');
  if (!formActionURL) {
    spaShow('404');
    return false;
  }

  await setupForm(formActionURL, visitorID);
  spaShow('form');

  const chatURL = formActionURL + '/' + visitorID;

  await loadReply(chatURL);
  document.getElementById('loadReply').addEventListener('click', (event) => {
    loadReply(chatURL);
  });
  spaShow('chat');
}

init();
