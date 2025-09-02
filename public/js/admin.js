document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    const postsList = document.getElementById('posts-list');
    
    // Load statistics and posts
    loadStatistics();
    loadAllPosts();
    
    // Handle form submission
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(createPostForm);
        
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('Post created successfully!');
                createPostForm.reset();
                loadAllPosts();
                loadStatistics();
            } else {
                alert('Error creating post');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating post');
        }
    });
    
    async function loadStatistics() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            document.getElementById('total-posts').textContent = stats.totalPosts;
            document.getElementById('total-likes').textContent = stats.totalLikes;
            
            const avgLikes = stats.totalPosts > 0 
                ? (stats.totalLikes / stats.totalPosts).toFixed(1) 
                : '0';
            document.getElementById('avg-likes').textContent = avgLikes;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    async function loadAllPosts() {
        try {
            // In a real app, you'd implement pagination for the admin panel too
            const response = await fetch('/api/posts?page=1&limit=50');
            const posts = await response.json();
            
            postsList.innerHTML = '';
            
            if (posts.length === 0) {
                postsList.innerHTML = '<p class="text-gray-600">No posts yet.</p>';
                return;
            }
            
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postsList.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }
    
    function createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'border border-gray-200 rounded-lg p-4';
        
        let mediaHtml = '';
        if (post.mediaType === 'image') {
            mediaHtml = `<img src="${post.mediaPath}" alt="Post image" class="w-32 h-auto rounded-lg mb-2">`;
        } else if (post.mediaType === 'video') {
            mediaHtml = `
                <video class="w-32 h-auto rounded-lg mb-2">
                    <source src="${post.mediaPath}" type="video/mp4">
                </video>
            `;
        }
        
        postDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    ${mediaHtml}
                    <p class="text-gray-700 mb-2">${post.content}</p>
                    <div class="text-sm text-gray-500">
                        <span>${new Date(post.createdAt).toLocaleDateString()}</span> • 
                        <span><i class="fa-solid fa-heart text-red-500"></i> ${post.likes} likes</span>
                    </div>
                </div>
                <div class="ml-4">
                    <button class="delete-post bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition" data-id="${post._id}">
                        Delete
                    </button>
                </div>
            </div>
        `;
        
        // Add delete functionality
        const deleteBtn = postDiv.querySelector('.delete-post');
        deleteBtn.addEventListener('click', () => deletePost(post._id, postDiv));
        
        return postDiv;
    }
    
    async function deletePost(postId, postElement) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                postElement.remove();
                loadStatistics();
                alert('Post deleted successfully');
            } else {
                alert('Error deleting post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post');
        }
    }
});