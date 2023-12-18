function getLikesFromStorage(imageIndex) {
    const storedLikes = localStorage.getItem(likes_$,{imageIndex});
    return storedLikes ? JSON.parse(storedLikes) : { liked: false, count: 0 };
}

function updateLikesUI() {
    const likeButtons = document.querySelectorAll('.like-button');

    likeButtons.forEach((button, index) => {
        const { liked, count } = getLikesFromStorage(index);
        if (liked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
        button.querySelector('#like-counter').innerText = count;
    });
}

function toggleLike(event) {
const likeButton = event.currentTarget;
const imageContainer = document.querySelector('.image-container');
const likeButtons = Array.from(imageContainer.querySelectorAll('.like-button'));
const imageIndex = likeButtons.indexOf(likeButton);
let { liked, count } = getLikesFromStorage(imageIndex);

if (!liked) {
    liked = true;
    count++;
    likeButton.classList.add('liked');
} else {
    liked = false;
    count--;
    likeButton.classList.remove('liked');
}

likeButton.querySelector('#like-counter').innerText = count;

localStorage.setItem(likes_$,{imageIndex}, JSON.stringify({ liked, count }));
}

const likeButtons = document.querySelectorAll('.like-button');
likeButtons.forEach(button => {
    button.addEventListener('click', toggleLike);
});

updateLikesUI();