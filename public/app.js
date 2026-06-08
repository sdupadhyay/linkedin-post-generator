document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputSection = document.getElementById('input-section');
    const postsContainer = document.getElementById('posts-container');
    const addPostBtn = document.getElementById('add-post-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const loadingState = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    
    const resultsContainer = document.getElementById('results');
    const dnaGrid = document.getElementById('dna-grid');
    const resetDnaBtn = document.getElementById('reset-dna-btn');
    const generateTopicsBtn = document.getElementById('generate-topics-btn');

    const topicsSection = document.getElementById('topics-section');
    const topicsGrid = document.getElementById('topics-grid');
    const customTopicInput = document.getElementById('custom-topic-input');
    const customTopicReasoning = document.getElementById('custom-topic-reasoning');
    const proceedBtn = document.getElementById('proceed-btn');

    const draftSection = document.getElementById('draft-section');
    const postDraftTextarea = document.getElementById('post-draft-textarea');
    const copyBtn = document.getElementById('copy-btn');

    // Initialize Supabase client (client‑side)
    const SUPABASE_URL = "https://<your-project>.supabase.co";
    const SUPABASE_ANON_KEY = "<your-anon-public-key>";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ----- AUTH UI -----
    // Simple modal for sign‑in / sign‑up
    const authSection = document.createElement('div');
    authSection.id = "auth-section";
    authSection.innerHTML = `
      <div id="auth-modal" class="hidden" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:20px; border-radius:8px; min-width:300px;">
          <h3 id="auth-mode-title">Sign In</h3>
          <input id="auth-email" type="email" placeholder="email" class="text-input" style="width:100%; margin-bottom:8px;"/>
          <input id="auth-pw" type="password" placeholder="password" class="text-input" style="width:100%; margin-bottom:8px;"/>
          <button id="auth-submit" class="btn primary" style="width:100%;">Log In</button>
          <p id="auth-switch" style="margin-top:8px; cursor:pointer; color:#0066cc;">No account? Sign up</p>
          <p id="auth-error" style="color:#c00;"></p>
        </div>
      </div>
      <button id="auth-btn" class="btn secondary" style="position:fixed; top:10px; right:10px;">Log In / Sign Up</button>
    `;
    document.body.appendChild(authSection);

    // Auth UI state
    let isSignIn = true;
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');
    const authModeTitle = document.getElementById('auth-mode-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitch = document.getElementById('auth-switch');
    const authError = document.getElementById('auth-error');

    authBtn.addEventListener('click', () => authModal.classList.toggle('hidden'));

    authSwitch.addEventListener('click', () => {
      isSignIn = !isSignIn;
      authModeTitle.textContent = isSignIn ? "Sign In" : "Sign Up";
      authSubmit.textContent = isSignIn ? "Log In" : "Create Account";
      authSwitch.textContent = isSignIn ? "No account? Sign up" : "Already have an account? Sign in";
      authError.textContent = "";
    });

    // After login / sign‑up, store session token and fetch stored DNA (if any)
    async function afterLogin() {
      // Hide auth UI
      authModal.classList.add('hidden');
      authBtn.textContent = `Logged in as ${document.getElementById('auth-email').value}`;
      const session = supabaseClient.auth.session();
      const token = session?.access_token;
      if (!token) return;

      // Patch global fetch to include Authorization header automatically
      const originalFetch = window.fetch;
      window.fetch = (input, init = {}) => {
        const authHeaders = { Authorization: `Bearer ${token}` };
        if (init.headers) {
          if (init.headers instanceof Headers) {
            init.headers.set('Authorization', `Bearer ${token}`);
          } else {
            init.headers = { ...init.headers, ...authHeaders };
          }
        } else {
          init.headers = authHeaders;
        }
        return originalFetch(input, init);
      };

      // Load any stored DNA for this user
      try {
        const resp = await fetch('/api/get-dna');
        if (resp.ok) {
          const { dna } = await resp.json();
          savedDna = dna;
          localStorage.setItem('writingDna', JSON.stringify(dna));
          renderDnaResults(dna);
          inputSection.classList.add('hidden');
        }
      } catch (e) {
        console.warn('No DNA stored for user or fetch error', e);
      }
    }

    authSubmit.addEventListener('click', async () => {
      const emailEl = document.getElementById('auth-email');
      const pwEl = document.getElementById('auth-pw');
      const email = emailEl.value.trim();
      const password = pwEl.value;
      authError.textContent = "";
      try {
        if (isSignIn) {
          const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabaseClient.auth.signUp({ email, password });
          if (error) throw error;
          authError.textContent = "Check your email for a confirmation link.";
          return;
        }
        await afterLogin();
      } catch (e) {
        authError.textContent = (e && e.message) || "Auth error";
      }
    });


    let postCount = 0;
    let selectedTopic = null; // { title: string, reasoning: string, isCustom: boolean }
    let savedDna = null;

    // Check Local Storage on Load
    const storedDna = localStorage.getItem('writingDna');
    if (storedDna) {
        savedDna = JSON.parse(storedDna);
        inputSection.classList.add('hidden');
        renderDnaResults(savedDna);
    } else {
        // Initialize with 5 textareas if no DNA saved
        for (let i = 0; i < 5; i++) {
            addPostTextarea();
        }
    }

    // --- EVENT LISTENERS ---

    addPostBtn.addEventListener('click', () => {
        if (postCount < 10) {
            addPostTextarea();
        } else {
            alert("Maximum 10 posts allowed for analysis.");
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        const textareas = document.querySelectorAll('.post-textarea');
        const posts = Array.from(textareas)
            .map(t => t.value.trim())
            .filter(text => text.length > 0);

        if (posts.length < 3) {
            alert("Please provide at least 3 valid posts to get a meaningful analysis (5-10 recommended).");
            return;
        }

        analyzeBtn.disabled = true;
        setLoading(true, "Analyzing writing patterns...");
        inputSection.classList.add('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ posts })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to analyze posts');
            }

            const data = await response.json();
            savedDna = data;
            localStorage.setItem('writingDna', JSON.stringify(data));
            renderDnaResults(data);
            // Persist DNA to Supabase for logged‑in user
            fetch('/api/save-dna', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dnaProfile: data })
            }).catch(err => console.warn('Failed to store DNA on server', err));
        } catch (error) {
            alert('Error: ' + error.message);
            inputSection.classList.remove('hidden');
        } finally {
            analyzeBtn.disabled = false;
            setLoading(false);
        }
    });

    resetDnaBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your DNA profile? You will need to paste your posts again.")) {
            localStorage.removeItem('writingDna');
            location.reload(); // Reload to reset state fully
        }
    });

    generateTopicsBtn.addEventListener('click', async () => {
        generateTopicsBtn.disabled = true;
        setLoading(true, "Generating trending topics based on your DNA...");
        topicsSection.classList.add('hidden');
        
        try {
            const response = await fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnaProfile: savedDna })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate topics');
            }

            const data = await response.json();
            renderTopics(data.topics);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            generateTopicsBtn.disabled = false;
            setLoading(false);
        }
    });

    const handleCustomInput = () => {
        const titleVal = customTopicInput.value.trim();
        const reasoningVal = customTopicReasoning.value.trim();
        
        if (titleVal.length > 0) {
            // Deselect AI topics if user types custom
            document.querySelectorAll('.topic-card').forEach(card => card.classList.remove('selected'));
            selectedTopic = { title: titleVal, reasoning: reasoningVal, isCustom: true };
            proceedBtn.disabled = false;
        } else if (!document.querySelector('.topic-card.selected')) {
            proceedBtn.disabled = true;
            selectedTopic = null;
        }
    };

    customTopicInput.addEventListener('input', handleCustomInput);
    customTopicReasoning.addEventListener('input', handleCustomInput);

    proceedBtn.addEventListener('click', async () => {
        if (!selectedTopic) return;
        
        proceedBtn.disabled = true;
        setLoading(true, "Drafting viral LinkedIn post...");
        topicsSection.classList.add('hidden');
        resultsContainer.classList.add('hidden');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnaProfile: savedDna, topic: selectedTopic })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate post');
            }

            const data = await response.json();
            renderDraft(data.post);
        } catch (error) {
            alert('Error: ' + error.message);
            topicsSection.classList.remove('hidden');
            resultsContainer.classList.remove('hidden');
        } finally {
            proceedBtn.disabled = false;
            setLoading(false);
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(postDraftTextarea.value);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = 'Copied! ✓';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            alert("Failed to copy text.");
        }
    });

    // --- HELPER FUNCTIONS ---

    function setLoading(isLoading, text = "") {
        if (isLoading) {
            loadingText.textContent = text;
            loadingState.classList.remove('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    function addPostTextarea() {
        postCount++;
        const id = postCount;
        
        const group = document.createElement('div');
        group.className = 'post-input-group';
        group.id = `post-group-${id}`;

        group.innerHTML = `
            <div class="post-header">
                <span>Post ${id}</span>
                ${id > 5 ? `<button class="remove-post-btn" onclick="removePost(${id})" title="Remove post">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>` : '<span></span>'}
            </div>
            <textarea class="post-textarea" placeholder="Paste LinkedIn post content here..."></textarea>
        `;

        postsContainer.appendChild(group);
    }

    window.removePost = function(id) {
        const group = document.getElementById(`post-group-${id}`);
        if (group) {
            group.remove();
            postCount--;
            updatePostLabels();
        }
    };

    function updatePostLabels() {
        const groups = document.querySelectorAll('.post-input-group');
        groups.forEach((group, index) => {
            const label = group.querySelector('.post-header span:first-child');
            label.textContent = `Post ${index + 1}`;
        });
    }

    function renderDnaResults(data) {
        dnaGrid.innerHTML = '';
        const fields = ['tone', 'avg_words', 'hoop_type', 'emoji_frequency', 'paragraph_size', 'writing_type', 'topic'];
        
        fields.forEach(field => {
            if (data[field]) {
                const item = data[field];
                
                let confClass = 'conf-low';
                let confText = 'Weak Signal';
                if (item.confidence >= 0.75) {
                    confClass = 'conf-high';
                    confText = 'Hard Rule';
                } else if (item.confidence >= 0.50) {
                    confClass = 'conf-med';
                    confText = 'Soft Guideline';
                }

                let displayValue = item.value;
                if (Array.isArray(displayValue)) {
                    displayValue = displayValue.join(', ');
                }

                const card = document.createElement('div');
                card.className = 'dna-card';
                card.innerHTML = `
                    <div class="card-header">
                        <span class="card-title">${field.replace('_', ' ')}</span>
                        <span class="confidence-badge ${confClass}">${Math.round(item.confidence * 100)}% - ${confText}</span>
                    </div>
                    <div class="card-value">${displayValue}</div>
                    <div class="card-reasoning">${item.reasoning}</div>
                `;
                dnaGrid.appendChild(card);
            }
        });

        resultsContainer.classList.remove('hidden');
    }

    function renderTopics(topics) {
        topicsGrid.innerHTML = '';
        
        topics.forEach((topic) => {
            let confClass = 'conf-low';
            if (topic.confidence >= 0.75) confClass = 'conf-high';
            else if (topic.confidence >= 0.50) confClass = 'conf-med';

            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="confidence-badge ${confClass}">Match Score: ${Math.round(topic.confidence * 100)}%</span>
                </div>
                <div class="topic-title">${topic.topic_title}</div>
                <div class="card-reasoning">${topic.reasoning}</div>
            `;
            
            card.addEventListener('click', () => {
                // Clear custom input if selecting AI topic
                customTopicInput.value = '';
                customTopicReasoning.value = '';
                
                // Toggle selection
                document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                selectedTopic = { title: topic.topic_title, reasoning: topic.reasoning, isCustom: false };
                proceedBtn.disabled = false;
            });

            topicsGrid.appendChild(card);
        });

        topicsSection.classList.remove('hidden');
        topicsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function renderDraft(postText) {
        postDraftTextarea.value = postText;
        draftSection.classList.remove('hidden');
        draftSection.scrollIntoView({ behavior: 'smooth' });
    }
});
