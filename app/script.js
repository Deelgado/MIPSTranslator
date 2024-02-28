
// Get references to the drop area and the file input
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');


// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when a file is dragged over
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

// Unhighlight drop area when a file is dragged away
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

// Function to prevent default drag behaviors
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Function to highlight the drop area when a file is dragged over
function highlight() {
  dropArea.classList.add('highlight');
}

// Function to unhighlight the drop area when a file is dragged away
function unhighlight() {
  dropArea.classList.remove('highlight');
}

// Function to handle dropped files
function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  processFiles(files);
}



// Optional: You can add hover effect to the drop area
dropArea.addEventListener('mouseenter', () => {
  dropArea.style.backgroundColor = '#f0f0f0';
});

dropArea.addEventListener('mouseleave', () => {
  dropArea.style.backgroundColor = '';
});

function processFiles(files) {
  const reader = new FileReader();

  reader.onload = function(event) {
    const fileContent = event.target.result;
    const lines = fileContent.trim().split('\n');

    // If there are less than two lines, return because the file is not formatted as expected
    if (lines.length < 2) {
      console.error("Invalid file format. Expected at least two lines.");
      return;
    }

    // Split the second line by spaces to get individual instructions
    const instructionsArray = lines[1].trim().split(/\s+/);

    // Translate each instruction and build the translated instructions for input textarea
    let translatedInstructions = '';
    let originalInstructions = '';
    instructionsArray.forEach(instruction => {
      const translated = translateInstructionToMIPS(instruction.trim());
      translatedInstructions += `${translated}\n`;
      originalInstructions += `${instruction.trim()}\n`;
    });

    // Set the value of input textarea with translated instructions
    const inputTextarea = document.getElementById('input');
    inputTextarea.value = translatedInstructions.trim();

    // Set the value of inputHex textarea with the original instructions
    const inputHexTextarea = document.getElementById('inputHex');
    inputHexTextarea.value = originalInstructions.trim();
  };

  reader.readAsText(files[0]);
}



function saveHexToFile() {
    const inputHexTextarea = document.getElementById('inputHex');

    // Get the value of the inputHex textarea
    const hexInstructions = inputHexTextarea.value.trim();

    // Check if hexInstructions is empty
    if (!hexInstructions) {
        console.error("No instructions found in inputHex textarea.");
        return;
    }

    // Split the hexInstructions by newline characters to get individual instructions
    const instructionsArray = hexInstructions.split('\n');

    // Join the instructions with a space to format them on the second line
    const instructionsLine = instructionsArray.join(' ');

    // Create a Blob with the hex instructions and instructions line
    const blob = new Blob(['v2.0 raw\n' + instructionsLine], { type: 'text/plain' });

    // Create a temporary anchor element to trigger the download
    const anchor = document.createElement('a');
    anchor.download = 'mips_instructions.hex';
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
}



function translateHextoMIPS() {
    const inputHexTextarea = document.getElementById('inputHex');
    const inputTextarea = document.getElementById('input');

    const instructions = inputHexTextarea.value.trim().split('\n');

    // Translate each hexadecimal instruction to MIPS
    const translatedInstructions = instructions.map(instruction => {
        return translateInstructionToMIPS(instruction.trim());
    });

    // Join the translated instructions with a newline character
    const formattedInstructions = translatedInstructions.join('\n');

    // Set the value of the input textarea to the formatted instructions
    inputTextarea.value = formattedInstructions;
}

function translateInstructionToMIPS(hexInstruction) {
    console.log("hexInstruction",hexInstruction);
    const opcodeMap = {
        "000000": "add", "000000": "sub","000000": "slt","000000": "and","000000": "or",
        "001000": "addi",  "100011": "lw","101011": "sw",
        "000100": "beq", "000101": "bne", 
        "000010": "j"
    };

    const funcMap = {
        "100000": "add",
        "100010": "sub",
        "101010": "slt",
        "100100": "and",
        "100101": "or",
    };

    const regMap = {
        "00000": "zero", "00001": "at", "00010": "v0", "00011": "v1",
        "00100": "a0", "00101": "a1", "00110": "a2", "00111": "a3",
        "01000": "t0", "01001": "t1", "01010": "t2", "01011": "t3",
        "01100": "t4", "01101": "t5", "01110": "t6", "01111": "t7",
        "10000": "s0", "10001": "s1", "10010": "s2", "10011": "s3",
        "10100": "s4", "10101": "s5", "10110": "s6", "10111": "s7",
        "11000": "t8", "11001": "t9", "11010": "k0", "11011": "k1",
        "11100": "gp", "11101": "sp", "11110": "fp", "11111": "ra"
    };
    const binaryInstruction = hexToBinary(hexInstruction);
    const opcode = binaryInstruction.slice(0, 6);
    console.log(opcode);
    const opcodeMIPS = opcodeMap[opcode];
    if (!opcodeMIPS) return "Unknown Instruction, opcode null";

    let mipsInstruction = opcodeMIPS + " ";

    if (["add", "sub", "slt", "and", "or"].includes(opcodeMIPS)) {
        // R-type instruction
        const func = binaryInstruction.slice(26, 32);;
        console.log("Instruction func ",func);
        const funcMIPS = funcMap[func];
        console.log("Instruction ",funcMIPS);
        if (!funcMIPS) return "Unknown Instruction (function)";
        mipsInstruction = funcMIPS + " ";
        const rs = regMap[binaryInstruction.slice(6, 11)];
        const rt = regMap[binaryInstruction.slice(11, 16)];
        const rd = regMap[binaryInstruction.slice(16, 21)];
        if (!rs || !rt || !rd) return "Invalid Registers";
        mipsInstruction += rd + " " + rs +" "+ rt;
    } else if (["lw", "sw"].includes(opcodeMIPS)) {
        // I-type instruction
        const rt = regMap[binaryInstruction.slice(6, 11)];
        const rs = regMap[binaryInstruction.slice(11, 16)];
        const offset = parseInt(binaryInstruction.slice(16, 32), 16);
        if (!rt || !rs || isNaN(offset)) return "Invalid Syntax";
        mipsInstruction += rs +" " +rt + " " + binaryToHex(offset) ;
    } else if (["addi"].includes(opcodeMIPS)) {
        // I-type instruction
        console.log("I-type instruction, addi");
        const rt = regMap[binaryInstruction.slice(6, 11)];
        const rs = regMap[binaryInstruction.slice(11, 16)];
        // const immediate = parseInt(binaryInstruction.slice(16, 32), 16);
        console.log('immediate ',binaryInstruction.slice(16, 32));
        console.log('immediate formated ',binaryToHex(binaryInstruction.slice(16, 32)));
        const immediate = binaryToHex(binaryInstruction.slice(16, 32));
        if (!rt || !rs || !immediate) return "Invalid Syntax";
        mipsInstruction += rs + " "+ rt  +" "+ immediate;
    } else if (["beq", "bne"].includes(opcodeMIPS)) {
        // I-type instruction
        const rs = regMap[binaryInstruction.slice(6, 11)];
        const rt = regMap[binaryInstruction.slice(11, 16)];
        const offset = parseInt(binaryInstruction.slice(16, 32), 16);
        if (!rs || !rt || isNaN(offset)) return "Invalid Syntax";
        // For simplicity, assuming label is an immediate value (offset)
        mipsInstruction += rs +" "+ rt + " " + offset;
    } else if (["j"].includes(opcodeMIPS)) {
        // J-type instruction
        const address = binaryToHex(binaryInstruction.slice(6, 32));
        if (isNaN(address)) return "Invalid Syntax";
        mipsInstruction += address;
    } else {
        return "Unsupported Instruction opcode",opcodeMIPS;
    }

    return mipsInstruction;
}


function translateMIPStoHex() {
    const inputTextArea = document.getElementById('input');
    const inputHexTextarea = document.getElementById('inputHex');

    const instructions = inputTextArea.value.trim().split('\n');

    // Translate each MIPS instruction to hexadecimal
    const translatedInstructions = instructions.map(instruction => {
        return translateInstructionToHex(instruction.trim());
    });

    // Join the translated instructions with a newline character
    const formattedInstructions = translatedInstructions.join('\n');

    // Set the value of the inputHex textarea to the formatted instructions
    inputHexTextarea.value = formattedInstructions;
}


function translateInstructionToHex(instruction) {
    const opcodeMap = {
        "add": "000000", "sub": "000000", "slt": "000000", "and": "000000", "or": "000000",
        "addi": "001000", "lw": "100011","sw": "101011", 
        "beq": "000100", "bne": "000101", 
        "j": "000010"
    };

    const funcMap = {
        "add": "100000", "sub": "100010", "slt": "101010", "and": "100100", "or": "100101",
    };

    const regMap = {
        "zero": "00000", "at": "00001", "v0": "00010", "v1": "00011",
        "a0": "00100", "a1": "00101", "a2": "00110", "a3": "00111",
        "t0": "01000", "t1": "01001", "t2": "01010", "t3": "01011",
        "t4": "01100", "t5": "01101", "t6": "01110", "t7": "01111",
        "s0": "10000", "s1": "10001", "s2": "10010", "s3": "10011",
        "s4": "10100", "s5": "10101", "s6": "10110", "s7": "10111",
        "t8": "11000", "t9": "11001", "k0": "11010", "k1": "11011",
        "gp": "11100", "sp": "11101", "fp": "11110", "ra": "11111"
    };

    const parts = instruction.split(' ');

    const opcode = opcodeMap[parts[0]];
    if (!opcode) return "Unknown Instruction";

    let binaryInstruction = opcode;
    console.log(parts[0]);
    if (["add", "sub", "slt", "and", "or"].includes(parts[0])) {
        // R-type instruction
        const rd = regMap[parts[1]];
        const rs = regMap[parts[2]];
        const rt = regMap[parts[3]];
        if (!rd || !rs || !rt) return "Invalid Registers";
        binaryInstruction += rs + rt + rd + "00000" + funcMap[parts[0]];
    } else if (["lw", "sw"].includes(parts[0])) {
        // I-type instruction
        const rt = regMap[parts[1]];
        const rs = regMap[parts[3].split(',')[0]];
        const immediate = parseInt(parts[2]);
        if (!rt || !rs || isNaN(immediate)) return "Invalid Syntax";
        binaryInstruction += rs + rt + (immediate >>> 0).toString(2).padStart(16, '0');
    } else if (["addi"].includes(parts[0])) {
        // I-type instruction
        const rt = regMap[parts[1]];
        const rs = regMap[parts[2]];
        const immediate = parseInt(parts[3]);
        if (!rt || !rs || isNaN(immediate)) return "Invalid Syntax";
        binaryInstruction += rs + rt + (immediate >>> 0).toString(2).padStart(16, '0');
    } else if (["beq", "bne"].includes(parts[0])) {
        // I-type instruction
        const rs = regMap[parts[1]];
        const rt = regMap[parts[2]];
        const label = parts[3];
        if (!rs || !rt) return "Invalid Registers";
        // For simplicity, assuming label is an immediate value (offset)
        const offset = parseInt(label);
        if (isNaN(offset)) return "Invalid Syntax";
        binaryInstruction += rs + rt + (offset >>> 0).toString(2).padStart(16, '0');
    } else if (["j"].includes(parts[0])) {
        // J-type instruction
        const address = parseInt(parts[1]);
        if (isNaN(address)) return "Invalid Syntax";
        binaryInstruction += (address >>> 0).toString(2).padStart(26, '0');
    } else {
        return "Unsupported Instruction";
    }

    // Convert binary instruction to hexadecimal
    const hexInstruction = parseInt(binaryInstruction, 2).toString(16).toUpperCase().padStart(8, '0');
    //return "0x" + hexInstruction;
    return hexInstruction;
}


function binaryToHex(binaryString) {
    // Pad the binary string with leading zeros to ensure it's a multiple of 4
    while (binaryString.length % 4 !== 0) {
        binaryString = '0' + binaryString;
    }

    // Initialize an empty string to store the hexadecimal representation
    let hexString = '';

    // Convert each group of 4 bits to its hexadecimal equivalent
    for (let i = 0; i < binaryString.length; i += 4) {
        const binaryChunk = binaryString.substr(i, 4); // Get a chunk of 4 bits
        const hexDigit = parseInt(binaryChunk, 2).toString(16); // Convert the chunk to hexadecimal
        hexString += hexDigit; // Append the hexadecimal digit to the result
    }

    // Return the hexadecimal representation
    return "0x"+hexString.toUpperCase(); // Convert to uppercase for consistency
}

function hexToBinary(hex) {
    let binary = '';
    for(let i = 0; i < hex.length; i++) {
        let bin = parseInt(hex[i], 16).toString(2);
        binary += bin.padStart(4, '0');
    }
    return binary;
}
