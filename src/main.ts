import './style.css';

let simValues: Record<string, number> = {};
let simFileHandle: FileSystemFileHandle | null = null;
let pendingValues: Record<string, number> = {};

async function openSimValuesFile() {
  try {
    [simFileHandle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    if (!simFileHandle) return;
    const file = await simFileHandle.getFile();
    const text = await file.text();
    simValues = JSON.parse(text);
    pendingValues = { ...simValues };
    // Show file path above controllers
    let filePathDiv = document.getElementById('jsonFilePath');
    if (!filePathDiv) {
      filePathDiv = document.createElement('div');
      filePathDiv.id = 'jsonFilePath';
      filePathDiv.style.margin = '1em 0';
      filePathDiv.style.color = '#0a3c8c';
      filePathDiv.style.fontWeight = 'bold';
      controllersDiv.parentElement!.insertBefore(filePathDiv, controllersDiv);
    }
    filePathDiv.textContent = `Selected JSON file: ${file.name}`;
    createControllersFromLocal();
    renderChangeButton();
    // Hide the file open UI after successful open
    const fileButtonDiv = document.getElementById('fileButton');
    if (fileButtonDiv) fileButtonDiv.style.display = 'none';
  } catch (err) {
    controllersDiv.innerHTML = '<span style="color:red;">Failed to open sim_values.json. Please select a valid JSON file.</span>';
  }
}

function renderFileButton() {
  return `
    <div style="margin-bottom: 1em; color: #ec0f0f; font-weight: bold;">Run agx simulation before opening the json file</div>
    <button id="openSimFile">Open sim_values.json</button>
  `;
}

function renderChangeButton() {
  let btn = document.getElementById('changeValuesBtn');
  let info = document.getElementById('changeInfoText');
  if (!info) {
    info = document.createElement('div');
    info.id = 'changeInfoText';
    info.style.marginTop = '2em';
    info.style.marginBottom = '0.5em';
    info.style.color = '#0a3c8c';
    info.style.fontWeight = 'bold';
    info.textContent = 'Please pause your simulation (by e button), click the save button, then un-pause your simulation';
    controllersDiv.parentElement!.appendChild(info);
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'changeValuesBtn';
    btn.textContent = 'Save changing values';
    btn.style.marginTop = '0.5em';
    btn.onclick = async () => {
      if (simFileHandle) {
        const writable = await simFileHandle.createWritable();
        await writable.write(JSON.stringify(pendingValues, null, 2));
        await writable.close();
        simValues = { ...pendingValues };
        alert('Values updated in JSON file!');
      }
    };
    controllersDiv.parentElement!.appendChild(btn);
  }
}

const app = document.getElementById('app') || document.body;
app.innerHTML = `
  <div id="fileButton">${renderFileButton()}</div>
  <div id="controllers"></div>
`;

const fileButtonDiv = document.getElementById('fileButton')!;
fileButtonDiv.querySelector('#openSimFile')!.addEventListener('click', openSimValuesFile);

const controllersDiv = document.getElementById('controllers')!;

function createControllersFromLocal() {
  controllersDiv.innerHTML = '';
  Object.keys(pendingValues).forEach((key) => {
    createValueController(controllersDiv, key, pendingValues[key]);
  });
}

function createValueController(container: HTMLElement, label: string, initialValue: number) {
  const id = label.replace(/\s+/g, '').toLowerCase();
  const controllerDiv = document.createElement('div');
  controllerDiv.className = 'controller';
  controllerDiv.id = `${id}-controller`;

  controllerDiv.innerHTML = `
    <h2>${label}</h2>
    <div class="controls">
      <label>
        Change Value: <input type="number" id="${id}-changeValue" value="0" />
      </label>
      <label>
        <input type="checkbox" id="${id}-percentMode" /> % change
      </label>
      <button id="${id}-inc">+</button>
      <button id="${id}-dec">-</button>
    </div>
    <div id="${id}-currentValue"></div>
  `;
  container.appendChild(controllerDiv);

  let currentValue = initialValue;

  const changeValueInput = controllerDiv.querySelector(`#${id}-changeValue`) as HTMLInputElement;
  const percentModeInput = controllerDiv.querySelector(`#${id}-percentMode`) as HTMLInputElement;
  const incBtn = controllerDiv.querySelector(`#${id}-inc`) as HTMLButtonElement;
  const decBtn = controllerDiv.querySelector(`#${id}-dec`) as HTMLButtonElement;
  const currentValueDiv = controllerDiv.querySelector(`#${id}-currentValue`) as HTMLDivElement;

  function updateValueDisplay() {
    currentValueDiv.innerHTML = `<h3>Initial: ${initialValue},   Pending: ${currentValue}</h3>`;
  }

  incBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const changeValue = Number(changeValueInput.value);
    const percentMode = percentModeInput.checked;
    if (percentMode) {
      currentValue += initialValue * (changeValue / 100);
    } else {
      currentValue += changeValue;
    }
    pendingValues[label] = currentValue;
    updateValueDisplay();
  });
  decBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const changeValue = Number(changeValueInput.value);
    const percentMode = percentModeInput.checked;
    if (percentMode) {
      currentValue -= initialValue * (changeValue / 100);
    } else {
      currentValue -= changeValue;
    }
    pendingValues[label] = currentValue;
    updateValueDisplay();
  });

  updateValueDisplay();
}
