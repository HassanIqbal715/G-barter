function createModalHTML() {
    if (document.getElementById('custom-modal')) return;

    const modalHTML = `
        <div id="custom-modal" class="modal-overlay">
            <div class="modal-box">
                <div id="modal-title" class="modal-title"></div>
                <div id="modal-message" class="modal-message"></div>
                <div id="modal-actions" class="modal-actions"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showModal(message, type = 'alert', onConfirm = null, title = null) {
    createModalHTML();

    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const actionsEl = document.getElementById('modal-actions');

    // Set content
    messageEl.textContent = message;
    
    if (title) {
        titleEl.textContent = title;
        titleEl.style.display = 'block';
    } else {
        titleEl.style.display = 'none';
    }

    // Clear actions
    actionsEl.innerHTML = '';

    // Create buttons based on type
    if (type === 'confirm') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = closeModal;

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-btn modal-btn-confirm';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        actionsEl.appendChild(cancelBtn);
        actionsEl.appendChild(confirmBtn);
    } else if (type === 'danger') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = closeModal;

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-btn modal-btn-danger';
        confirmBtn.textContent = 'Delete'; // Or whatever action
        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        actionsEl.appendChild(cancelBtn);
        actionsEl.appendChild(confirmBtn);
    } else {
        // Alert
        const okBtn = document.createElement('button');
        okBtn.className = 'modal-btn modal-btn-confirm';
        okBtn.textContent = 'OK';
        okBtn.onclick = closeModal;
        actionsEl.appendChild(okBtn);
    }

    // Show modal
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', createModalHTML);
