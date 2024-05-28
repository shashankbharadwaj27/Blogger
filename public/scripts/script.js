async function toggleLike(blogId) {
    try {
        const response = await fetch(`/blog/${blogId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById('like-count').innerText = result.likesCount;
            const likeButton = document.getElementById('like-button');
            likeButton.innerHTML = result.liked ? '<i class="fa-solid fa-heart" style="color:red"></i>' : '<i class="fa-regular fa-heart"></i>';
        } else {
            console.error('Error liking the blog');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}