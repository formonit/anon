import securelayEndpoint from 'https://cdn.jsdelivr.net/gh/securelay/api@v0.0.1/script.js';

const securelayAddrKey = decodeURIComponent(location.pathname.split('/').pop());
const [ securelayPubKey, securelayEndpointID ] = securelayAddrKey.split('@');
const securelayEndpointURL = securelayEndpoint(securelayEndpointID)[0];

const formActionURL = securelayEndpointURL + '/public/' + securelayPubKey;

let visitorID;
let chatURL;

// Brief: Returns the first 5 hex chars from a v4 UUID as a unique string
function newVisitorID () {
  const id = crypto.randomUUID().substr(0,5);
  localStorage.setItem('visitorID', id);
  return id;
}

function logChat (msg, received=true) {
  const chatbox = document.getElementById('chatbox');
  const row = document.createElement('p');
  let sender = 'You';
  if(received) sender = 'Me';
  const entry = `${sender}[${Date()}]: ${msg}`
  row.append(entry);
  chatbox.prepend(row);
}

async function loadReply () {
  await fetch(chatURL)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then((data) => data['Message'])
      .then((reply) => { 
        logChat(reply);
      })
      .catch((err) => true);
}

function setupForm () {
  const contactForm = document.forms.contact;
  const checkImgURL = 'https://img.icons8.com/color/30/approval--v1.png';
  const crossImgURL = 'https://img.icons8.com/emoji/30/cross-mark-emoji.png';
  const query = `?ok=${encodeURIComponent(checkImgURL)}&err=${encodeURIComponent(crossImgURL)}`;
  contactForm.elements['ChatID'].value = visitorID;
  contactForm.action = formActionURL + query;
  
  contactForm.addEventListener('submit', async (event) => {
    const thisForm = event.target;
    await loadReply();
    const msg = thisForm.elements['Message'].value;
    logChat(msg, false);
  })
}

async function init () {
  visitorID = localStorage.getItem('visitorID') ?? newVisitorID();
  const isRevisit = false;
  if (! isRevisit) {
    const viewCounterFormID = document.forms['viewCounter'].elements['FormID'].value;
    try {
      const response = await fetch(formActionURL, {
        mode: 'no-cors',
        method: 'POST',
        body: JSON.stringify({ FormID: viewCounterFormID }),
        headers: {'Content-Type': 'application/json'}
      })
      if (response.status != 200) throw new Error();
    } catch (err) {
      spaShow('404');
      console.error(err);
      return false;
    }
  }
  
  setupForm();
  spaShow('form');
  
  chatURL = formActionURL + '/' + visitorID;
  await loadReply();
  document.getElementById('loadReply').addEventListener('click', (event) => {
    loadReply();
  })
  spaShow('chat');
}

init();
