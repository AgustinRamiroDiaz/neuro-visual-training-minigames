import Phaser from 'phaser';

const emitter = new Phaser.Events.EventEmitter();

export const EventBus = {
  emit: emitter.emit.bind(emitter),
  on: emitter.on.bind(emitter),
  off: emitter.off.bind(emitter),
  once: emitter.once.bind(emitter),
};
