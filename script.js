import securelayEndpoint from 'https://cdn.jsdelivr.net/gh/securelay/api@v0.0.1/script.js';

const securelayAddrKey = decodeURIComponent(location.pathname.split('/').pop());
const [ securelayPubKey, securelayEndpointID ] = securelayAddrKey.split('@');
const securelayEndpointURL = securelayEndpoint(securelayEndpointID)[0];

const formActionURL = securelayEndpointURL + '/public/' + securelayPubKey;

// Brief: Returns the first 5 hex chars from a v4 UUID as a unique string
function newVisitorID () {
  const id = crypto.randomUUID().substr(0,5);
  localStorage.setItem('visitorID', id);
  return id;
}

const visitorID = localStorage.getItem('visitorID') ?? newVisitorID();
const chatURL = formActionURL + '/' + visitorID;

function setupForm () {
  const contactForm = document.forms.contact;
  const checkImgURL = 'https://img.icons8.com/color/30/approval--v1.png';
  const crossImgURL = 'https://img.icons8.com/emoji/30/cross-mark-emoji.png';
  const query = `?ok=${encodeURIComponent(checkImgURL)}&err=${encodeURIComponent(crossImgURL)}`;
  contactForm.elements['chatID'].value = visitorID;
  contactForm.action = formActionURL + query;
}

function logChat (msg, received=true) {
  const chatbox = document.getElementById('chat');
  const row = document.createElement('p');
  let sender = 'You';
  if(received) sender = 'Me';
  const entry = `${sender}[${Date()}]: ${msg}`
  row.append(entry);
  logs.prepend(row);
}

async function loadReply () {
  const reply = await fetch(chatURL)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then((data) => data['Message']);
  logChat(reply);
}

setupForm();
