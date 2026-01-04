const form = document.getElementById("pitch-form");
const generateBtn = document.getElementById("generate-btn");
const statusLine = document.getElementById("status");
const scriptOutput = document.getElementById("script-output");
const copyBtn = document.getElementById("copy-btn");
const timeBadge = document.getElementById("time-badge");
const apiKeyInput = document.getElementById("apiKey");
const modelSelect = document.getElementById("model");
const themeToggleBtn = document.getElementById("theme-toggle");

const DEFAULT_MODEL = "gemini-1.5-flash";
const DEFAULT_HACKATHON = "DemoPitch AI Hackathon";
const WORDS_PER_MINUTE = 130;
const TARGET_MINUTES = 2;
const THEME_STORAGE_KEY = "demopitch-theme";
const THEMES = { LIGHT: "light", DARK: "dark" };
const DEFAULT_THEME = THEMES.DARK;

initializeTheme();

themeToggleBtn?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || THEMES.DARK;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = collectFormData(new FormData(form));
  const { apiKey, model, hackathonName, ...projectDetails } = payload;
  const pitchContext = { ...projectDetails, hackathonName };

  setLoadingState(true);
  setStatus("Generating your spoken-style script...", "info");

  let scriptText = "";
  let usedFallback = false;

  try {
    scriptText = await requestGeminiScript(pitchContext, apiKey, model);
    setStatus(`Success! Script generated via ${model}.`, "success");
  } catch (error) {
    usedFallback = true;
    scriptText = buildFallbackScript(pitchContext);
    setStatus(
      `Using the offline template because: ${error.message}. Add your API key in the form above to hit Gemini.`,
      "error"
    );
    console.error(error);
  }

  renderScript(scriptText, usedFallback);
  setLoadingState(false);
});

copyBtn.addEventListener("click", async () => {
  const text = scriptOutput.textContent?.trim();
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy script"), 1600);
    setStatus("Script copied to clipboard.", "success");
  } catch (error) {
    console.error(error);
    setStatus("Clipboard permissions blocked. Copy manually instead.", "error");
  }
});

function collectFormData(formData) {
  return {
    apiKey: (formData.get("apiKey") || "").trim(),
    model: formData.get("model") || DEFAULT_MODEL,
    hackathonName: (formData.get("hackathonName") || "").trim() || DEFAULT_HACKATHON,
    projectName: formData.get("projectName").trim(),
    problem: formData.get("problem").trim(),
    solution: formData.get("solution").trim(),
    techStack: formData.get("techStack").trim(),
    targetUsers: formData.get("targetUsers").trim(),
  };
}

async function requestGeminiScript(payload, apiKey, model) {
  if (!apiKey) {
    apiKeyInput?.focus();
    throw new Error("no Gemini API key found");
  }

  const prompt = buildPrompt(payload);
  const selectedModel = model || modelSelect?.value || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error?.message || response.statusText;
    throw new Error(message || "Gemini request failed");
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function buildPrompt({ projectName, problem, solution, techStack, targetUsers, hackathonName }) {
  return `You are a confident hackathon presenter preparing a two-minute spoken script for the ${hackathonName} demo stage.
Structure the script with these titled sections: Introduction, Problem, Solution Walkthrough, Tech Stack, What We Learned, Closing Invitation.
Use a clear, conversational tone that sounds like live narration.
Project: ${projectName}
Problem: ${problem}
Solution: ${solution}
Tech Stack: ${techStack}
Target Users: ${targetUsers}
Highlight why the audience should care, keep the pace around 2 minutes (~250-270 words), and end with a strong invite to judges.`;
}

function buildFallbackScript({ projectName, problem, solution, techStack, targetUsers, hackathonName }) {
  return (
    `Introduction\n` +
    `Hi everyone at ${hackathonName}, we are thrilled to show you ${projectName}, built in under 48 hours to push what is possible with accessible AI tooling.\n\n` +
    `Problem\n` +
    `${problem}\n\n` +
    `Solution Walkthrough\n` +
    `${solution}\n\n` +
    `Tech Stack\n` +
    `Under the hood we combined ${techStack}. Each choice kept us shipping quickly without sacrificing reliability.\n\n` +
    `What We Learned\n` +
    `Shipping fast forced us to distill the signal: listen to ${targetUsers}, automate the boring parts, and leave time for polish.\n\n` +
    `Closing Invitation\n` +
    `Thanks for spending a slice of your demo tour with ${projectName}. We would love to continue the conversation, so swing by after judging to try it firsthand.`
  );
}

function renderScript(text, usedFallback) {
  scriptOutput.textContent = text;
  copyBtn.disabled = false;
  copyBtn.textContent = usedFallback ? "Copy template" : "Copy script";
  updateTimeBadge(text);

  if (usedFallback) {
    scriptOutput.dataset.source = "fallback";
  } else {
    delete scriptOutput.dataset.source;
  }
}

function updateTimeBadge(scriptText) {
  const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / WORDS_PER_MINUTE;
  const rounded = minutes.toFixed(1);
  timeBadge.hidden = false;
  timeBadge.textContent = `${words} words · ~${rounded} min`;

  if (minutes > TARGET_MINUTES + 0.2) {
    timeBadge.classList.add("over-limit");
    timeBadge.title = "Trim ~20 seconds for a tighter delivery.";
  } else {
    timeBadge.classList.remove("over-limit");
    timeBadge.removeAttribute("title");
  }
}

function setLoadingState(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "Crafting script..." : "Generate demo script";
  generateBtn.setAttribute("aria-busy", String(isLoading));
}

function setStatus(message, variant = "info") {
  statusLine.textContent = message;
  statusLine.dataset.state = variant;
}

function initializeTheme() {
  const storedTheme = readStoredTheme();
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const initialTheme = storedTheme || (prefersLight ? THEMES.LIGHT : DEFAULT_THEME);
  applyTheme(initialTheme);
}

function applyTheme(mode) {
  const safeMode = mode === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
  document.documentElement.setAttribute("data-theme", safeMode);
  persistTheme(safeMode);

  if (themeToggleBtn) {
    const isLight = safeMode === THEMES.LIGHT;
    themeToggleBtn.textContent = isLight ? "Switch to dark mode" : "Switch to bright mode";
    themeToggleBtn.setAttribute("aria-pressed", String(isLight));
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn("Theme preference could not be read", error);
    return null;
  }
}

function persistTheme(mode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Theme preference could not be saved", error);
  }
}
