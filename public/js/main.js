document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let isLoading = false;
    const postsContainer = document.getElementById('posts-container');
    const loadingIndicator = document.getElementById('loading');
    
    // Load initial posts
    loadPosts();
    
    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadPosts();
        }
    });
    
    async function loadPosts() {
        isLoading = true;
        loadingIndicator.classList.remove('hidden');
        
        try {
            const response = await fetch(`/api/posts?page=${currentPage}`);
            const posts = await response.json();
            
            if (posts.length === 0) {
                // No more posts to load
                window.removeEventListener('scroll', scrollHandler);
                loadingIndicator.innerHTML = '<p class="text-gray-600">No more posts to load</p>';
                return;
            }
            
            // Render posts
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
            });
            
            currentPage++;
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            isLoading = false;
            loadingIndicator.classList.add('hidden');
        }
    }
    
    function createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'bg-white rounded-lg shadow-md p-6 fade-in';
        
        let mediaHtml = '';
        if (post.mediaType === 'image') {
            mediaHtml = `<img src="${post.mediaPath}" alt="Post image" class="w-full h-auto rounded-lg mb-4">`;
        } else if (post.mediaType === 'video') {
            mediaHtml = `
                <video controls class="w-full h-auto rounded-lg mb-4">
                    <source src="${post.mediaPath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }
        
        postDiv.innerHTML = `
            <div class="mb-4">
                ${mediaHtml}
            </div>
            <p class="text-gray-700 mb-4">${post.content}</p>
            <div class="flex justify-between items-center">
                <div class="text-gray-500 text-sm">
                    ${new Date(post.createdAt).toLocaleDateString()}
                </div>
                <button class="like-btn flex items-center space-x-1 text-gray-500 hover:text-red-500 transition" data-id="${post._id}">
                    <i class="fa-regular fa-heart"></i>
                    <span class="like-count">${post.likes}</span>
                </button>
            </div>
        `;
        
        // Add like functionality
        const likeBtn = postDiv.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => likePost(post._id, likeBtn));
        
        return postDiv;
    }
    
    async function likePost(postId, button) {
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            // Update like count
            const likeCount = button.querySelector('.like-count');
            likeCount.textContent = result.likes;
            
            // Change icon to solid and add animation
            const icon = button.querySelector('i');
            icon.className = 'fa-solid fa-heart text-red-500';
            button.classList.add('like-animation');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                button.classList.remove('like-animation');
            }, 800);
            
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }
    
    // Throttle scroll events for better performance
    let scrollTimeout;
    function scrollHandler() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading) {
                loadPosts();
            }
        }, 200);
    }
});