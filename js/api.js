/**
 * TaskFlow - External REST API Integration Module
 * Integrates DummyJSON Todos API, Advice Slip API, and Live Weather API using fetch() and async/await.
 * Provides loading states, error handling, retries, and offline fallbacks.
 */

// Curated themes and high-definition photographs for the Daily Inspiration section
export const INSPIRATION_THEMES = [
  {
    theme: "Hope & New Beginnings",
    tag: "New Beginnings",
    photoUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-mountain.svg",
    photoCaption: "Alpine Sunrise • Hope & New Beginnings",
    photoAlt: "Majestic sunrise over misty alpine peaks welcoming a fresh productive day",
    fallbackAdvice: "Every morning brings new potential. Focus on what you can build today rather than yesterday's unfinished work."
  },
  {
    theme: "Focus & Deep Work",
    tag: "Deep Focus",
    photoUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-workspace.svg",
    photoCaption: "Minimalist Workspace • Deep Work",
    photoAlt: "Serene minimalist wooden desk with natural morning light and notebook",
    fallbackAdvice: "Focus on being productive instead of busy — small daily improvements lead to stunning results."
  },
  {
    theme: "Determination & Grit",
    tag: "Determination",
    photoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-climber.svg",
    photoCaption: "Mountain Summit • Grit & Persistence",
    photoAlt: "Hiker standing triumphant on a mountain ridge above the cloud inversion",
    fallbackAdvice: "The secret of getting ahead is getting started. Break down large challenges into small, manageable commits."
  },
  {
    theme: "Personal Growth & Journey",
    tag: "Continuous Growth",
    photoUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-forest.svg",
    photoCaption: "Sunlit Forest Trail • Personal Growth",
    photoAlt: "Sunbeams piercing through a tall evergreen pine forest over a quiet pathway",
    fallbackAdvice: "Consistency is what transforms average into excellence. Growth happens one steady habit at a time."
  },
  {
    theme: "Peace & Mindful Reflection",
    tag: "Inner Calm",
    photoUrl: "https://images.unsplash.com/photo-1439853941329-a93ac41f7142?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-lake.svg",
    photoCaption: "Tranquil Alpine Lake • Reflection",
    photoAlt: "Crystal clear mountain lake reflecting snow-capped peaks in tranquil stillness",
    fallbackAdvice: "Take a breath, clear your mental tabs, and focus on the single next task with calm clarity."
  },
  {
    theme: "Vision & Engineering Clarity",
    tag: "Bold Vision",
    photoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
    fallbackUrl: "assets/images/inspiration-architecture.svg",
    photoCaption: "Modern Horizon • Architectural Vision",
    photoAlt: "Sleek geometric architectural angles soaring into an expansive blue sky",
    fallbackAdvice: "Great things in tech are never done by one person; they are done by a passionate team building together."
  }
];

let currentThemeIndex = 0;

export const Api = {
  /**
   * Fetch motivational advice from the Advice Slip API.
   * Endpoint: https://api.adviceslip.com/advice
   * Requirements:
   * - Fetch a new piece of advice when requested.
   * - Display a loading animation while retrieving the quote.
   * - Handle network failures gracefully.
   * - Provide a fallback quote if the API is unavailable.
   * - Animate the quote and image transition smoothly.
   * - Never invent an author for an unattributed API response.
   */
  async fetchAdvice() {
    // Rotate to the next thematic photograph
    currentThemeIndex = (currentThemeIndex + 1) % INSPIRATION_THEMES.length;
    const themeMeta = INSPIRATION_THEMES[currentThemeIndex];

    const url = `https://api.adviceslip.com/advice?t=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.slip && data.slip.advice) {
        return {
          success: true,
          advice: data.slip.advice,
          slipId: data.slip.id,
          sourceBadge: `Advice Slip #${data.slip.id}`,
          // Genuine attribution: Advice Slip API returns unattributed life advice.
          // Rule: Never invent an author for an unattributed API response.
          author: null,
          theme: themeMeta.theme,
          tag: themeMeta.tag,
          photoUrl: themeMeta.photoUrl,
          fallbackUrl: themeMeta.fallbackUrl,
          photoCaption: themeMeta.photoCaption,
          photoAlt: themeMeta.photoAlt
        };
      } else {
        throw new Error('Malformed JSON payload from Advice Slip API');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const errorMessage = isAbort
        ? 'Connection timed out. Displaying curated inspiration.'
        : (err.message || 'Network unavailable');

      return {
        success: false,
        advice: themeMeta.fallbackAdvice,
        slipId: null,
        sourceBadge: 'Curated Inspiration',
        author: null,
        error: errorMessage,
        theme: themeMeta.theme,
        tag: themeMeta.tag,
        photoUrl: themeMeta.photoUrl,
        fallbackUrl: themeMeta.fallbackUrl,
        photoCaption: themeMeta.photoCaption,
        photoAlt: themeMeta.photoAlt
      };
    }
  },

  /**
   * Fetch sample tasks from DummyJSON Todos API.
   * Endpoint: https://dummyjson.com/todos
   * Requirements:
   * - Use JavaScript fetch with async/await.
   * - Show loading indicators.
   * - Handle HTTP errors, network failures, and invalid responses.
   * - Provide a retry option.
   * - Allow users to import a sample task into their own task list.
   * - Clearly distinguish sample tasks from user-created tasks.
   * - Do not overwrite saved user tasks when fetching sample data.
   * - Avoid unnecessary repeated requests.
   */
  async fetchDemoTodos(limit = 8) {
    const url = `https://dummyjson.com/todos?limit=${limit}&skip=0`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.todos)) {
        throw new Error('Invalid todos payload received from DummyJSON API');
      }

      const categories = ['GDG', 'Academics', 'Personal'];
      const priorities = ['High', 'Medium', 'Low'];

      // Format DummyJSON todos into TaskFlow-ready sample task format
      const formattedTodos = data.todos.map((todo, idx) => {
        const cat = categories[idx % categories.length];
        const pri = priorities[idx % priorities.length];

        const daysOffset = (idx % 4) - 1; // -1 (overdue), 0 (today), 1 (tomorrow), 2 (upcoming)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysOffset);
        const dueDate = targetDate.toISOString().split('T')[0];

        return {
          id: `sample-todo-${todo.id}`,
          dummyId: todo.id,
          userId: todo.userId,
          title: todo.todo,
          description: `Sample task fetched from DummyJSON Todos API (ID: #${todo.id}, User #${todo.userId}). Click 'Import to My Tasks' to save it permanently.`,
          priority: pri,
          category: cat,
          dueDate: dueDate,
          status: todo.completed ? 'Completed' : (idx % 2 === 0 ? 'In Progress' : 'Pending'),
          isSample: true, // Strictly marks as external sample data
          subtasks: [
            { id: `sample-sub-${todo.id}-1`, title: 'Review API payload specifications', completed: todo.completed },
            { id: `sample-sub-${todo.id}-2`, title: 'Verify task status and priority', completed: false }
          ]
        };
      });

      return {
        success: true,
        todos: formattedTodos,
        total: data.total || formattedTodos.length
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const errorMessage = isAbort
        ? 'Request timed out while connecting to DummyJSON.'
        : (err.message || 'Unable to reach DummyJSON Todos API');

      return {
        success: false,
        error: errorMessage,
        todos: []
      };
    }
  },

  /**
   * Live Weather Widget API (Bonus Feature #10)
   * Uses Open-Meteo API: 100% free, zero API key required, zero privacy/secret leaks.
   * Can also accept an optional user-provided OpenWeatherMap key if set in settings.
   */
  async fetchLiveWeather(customApiKey = '', defaultCity = 'Kolkata') {
    // If user provided custom OpenWeatherMap key in Settings
    if (customApiKey && customApiKey.trim().length > 10) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(defaultCity)}&units=metric&appid=${customApiKey.trim()}`);
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            city: data.name || defaultCity,
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            icon: data.weather[0].icon.includes('d') ? 'sun' : 'moon'
          };
        }
      } catch {
        // Fall through to Open-Meteo
      }
    }

    // Default: Open-Meteo (No API key needed)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Default coordinates for Kolkata (GDG BPPIMT region)
      const lat = 22.5726;
      const lon = 88.3639;

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const current = data.current_weather;
        const temp = Math.round(current.temperature);
        const code = current.weathercode;

        let condition = 'Clear Sky';
        let icon = 'sun';

        if (code === 0) { condition = 'Clear Sky'; icon = 'sun'; }
        else if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; icon = 'cloud-sun'; }
        else if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = 'cloud'; }
        else if (code >= 51 && code <= 67) { condition = 'Light Rain'; icon = 'cloud-rain'; }
        else if (code >= 71 && code <= 77) { condition = 'Snow Flurries'; icon = 'cloud-snow'; }
        else if (code >= 80 && code <= 82) { condition = 'Showers'; icon = 'cloud-drizzle'; }
        else if (code >= 95) { condition = 'Thunderstorm'; icon = 'cloud-lightning'; }

        return {
          success: true,
          city: defaultCity,
          temp: temp,
          condition: condition,
          icon: icon
        };
      }
    } catch {
      // Graceful offline fallback
    }

    return {
      success: true,
      city: defaultCity,
      temp: 26,
      condition: 'Sunny & Productive',
      icon: 'sun'
    };
  }
};
