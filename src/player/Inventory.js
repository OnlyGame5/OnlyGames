import { EventEmitter } from '../utils/EventEmitter.js';

export class Inventory extends EventEmitter {
  constructor() {
    super();
    this.slots = [null, null, null, null, null]; // 5 slots
    this.selectedSlot = 0;
  }

  addItem(item) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item;
        console.log(`Added ${item.name} to inventory slot ${i + 1}`);
        this.updateUI();
        this.emit('itemAdded', item, i);
        return true;
      }
    }
    console.log("Inventory is full!");
    this.emit('inventoryFull');
    return false;
  }

  hasItem(itemName) {
    return this.slots.some(item => item && item.name === itemName);
  }

  removeItem(itemName) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].name === itemName) {
        const item = this.slots[i];
        this.slots[i] = null;
        console.log(`Removed ${itemName} from inventory`);
        this.updateUI();
        this.emit('itemRemoved', item, i);
        return true;
      }
    }
    return false;
  }

  getSelectedItem() {
    return this.slots[this.selectedSlot];
  }

  selectSlot(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.slots.length) {
      this.selectedSlot = slotIndex;
      this.updateUI();
      this.emit('slotSelected', slotIndex);
    }
  }

  updateUI() {
    const inventoryElement = document.getElementById('inventory');
    if (!inventoryElement) return;

    const slots = inventoryElement.querySelectorAll('.inventory-slot');

    slots.forEach((slot, index) => {
      const item = this.slots[index];
      const iconElement = slot.querySelector('.item-icon');

      // Update selection highlight
      slot.classList.toggle('selected', index === this.selectedSlot);

      // Update item display
      if (item) {
        slot.classList.add('filled');
        iconElement.textContent = this.getItemIcon(item.name);
        iconElement.title = item.description || item.name;
      } else {
        slot.classList.remove('filled');
        iconElement.textContent = '';
        iconElement.title = '';
      }
    });
  }

  getItemIcon(itemName) {
    switch (itemName) {
      case 'stage0-key':
        return '🗝️';
      case 'room1-note':
        return '📝';
      default:
        return '📦';
    }
  }

  getItems() {
    return this.slots.filter(item => item !== null);
  }

  isEmpty() {
    return this.slots.every(slot => slot === null);
  }

  isFull() {
    return this.slots.every(slot => slot !== null);
  }
}
