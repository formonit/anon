import securelayEndpoint from 'https://cdn.jsdelivr.net/gh/securelay/api@v0.0.1/script.js';

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
  const entry = `${sender}[${Date()}]: ${msg}`;
  row.append(entry);
  chatbox.prepend(row);
}

async function loadReply (chatURL) {
  return fetch(chatURL)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((data) => data.Message)
    .then((reply) => {
      logChat(reply);
    })
    .catch((err) => err.message);
}

function setupForm (formActionURL, visitorID) {
  const contactForm = document.forms.contact;
  const checkImgURL = 'https://img.icons8.com/color/30/approval--v1.png';
  const crossImgURL = 'https://img.icons8.com/emoji/30/cross-mark-emoji.png';
  const query = `?ok=${encodeURIComponent(checkImgURL)}&err=${encodeURIComponent(crossImgURL)}`;
  contactForm.elements.ChatID.value = visitorID;
  contactForm.action = formActionURL + query;

  contactForm.addEventListener('submit', async (event) => {
    const thisForm = event.target;
    await loadReply(formActionURL + '/' + visitorID);
    const msg = thisForm.elements.Message.value;
    logChat(msg, false);
  });
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

  setupForm(formActionURL, visitorID);
  spaShow('form');

  const chatURL = formActionURL + '/' + visitorID;

  await loadReply(chatURL);
  document.getElementById('loadReply').addEventListener('click', (event) => {
    loadReply(chatURL);
  });
  spaShow('chat');
}

init();
