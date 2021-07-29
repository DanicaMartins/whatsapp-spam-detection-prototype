const POST_COMMENT_BTN = document.getElementById('post');
const COMMENT_TEXT = document.getElementById('comment');
const COMMENTS_LIST = document.getElementById('commentsList');

const PROCESSING_CLASS = 'processing';

var currentUserName = 'Anonymous';

const MODEL_JSON_URL = 'model.json';

const SPAM_THRESHOLD = 0.6;

var model = undefined;

 async function loadAndPredict(inputTensor, domComment) {

  if (model === undefined) {
    model = await tf.loadLayersModel(MODEL_JSON_URL);
  }
  
  var results = await model.predict(inputTensor);
  
  results.print();

  results.data().then((dataArray)=>{
    if (dataArray[1] > SPAM_THRESHOLD) {
      domComment.classList.add('spam');
    }else {
      socket.emit('comment', {
        username: currentUserName,
        timestamp: domComment.querySelectorAll('span')[1].innerText,
        comment: domComment.querySelectorAll('p')[0].innerText
      });
    }
  })
}

import * as DICTIONARY from '/dictionary.js';

const ENCODING_LENGTH = 20;

function tokenize(wordArray) {

  let returnArray = [DICTIONARY.START];

  for (var i = 0; i < wordArray.length; i++) {
    let encoding = DICTIONARY.LOOKUP[wordArray[i]];
    returnArray.push(encoding === undefined ? DICTIONARY.UNKNOWN : encoding);
  }
  
  while (i < ENCODING_LENGTH - 1) {
    returnArray.push(DICTIONARY.PAD);
    i++;
  }

  console.log([returnArray]);
  
  return tf.tensor([returnArray]);
}

 function handleCommentPost() {

  if (! POST_COMMENT_BTN.classList.contains(PROCESSING_CLASS)) {

    POST_COMMENT_BTN.classList.add(PROCESSING_CLASS);
    COMMENT_TEXT.classList.add(PROCESSING_CLASS);

    let currentComment = COMMENT_TEXT.innerText;
  
    let lowercaseSentenceArray = currentComment.toLowerCase().replace(/[^\w\s]/g, ' ').split(' ');
    
    let li = document.createElement('li');
    
    loadAndPredict(tokenize(lowercaseSentenceArray), li).then(function() {

      POST_COMMENT_BTN.classList.remove(PROCESSING_CLASS);
      COMMENT_TEXT.classList.remove(PROCESSING_CLASS);
      
      let p = document.createElement('p');
      p.innerText = COMMENT_TEXT.innerText;
      
      let spanName = document.createElement('span');
      spanName.setAttribute('class', 'username');
      spanName.innerText = currentUserName;
      
      let spanDate = document.createElement('span');
      spanDate.setAttribute('class', 'timestamp');
      let curDate = new Date();
      spanDate.innerText = curDate.toLocaleString();
      
      li.appendChild(spanName);
      li.appendChild(spanDate);
      li.appendChild(p);
      COMMENTS_LIST.append(li);

      COMMENT_TEXT.innerText = '';
    });
  }
}

POST_COMMENT_BTN.addEventListener('click', handleCommentPost);

var socket = io.connect();


function handleRemoteComments(data) {

  let li = document.createElement('li');
  let p = document.createElement('p');
  p.innerText = data.comment;

  let spanName = document.createElement('span');
  spanName.setAttribute('class', 'username');
  spanName.innerText = data.username;

  let spanDate = document.createElement('span');
  spanDate.setAttribute('class', 'timestamp');
  spanDate.innerText = data.timestamp;

  li.appendChild(spanName);
  li.appendChild(spanDate);
  li.appendChild(p);
  
  COMMENTS_LIST.append(li);
}

socket.on('remoteComment', handleRemoteComments);