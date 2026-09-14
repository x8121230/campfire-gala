export function buildResourceIcons(parent) {
  const result = {};
  for (const [kind, label, color, shape] of [
    ['hp', '生命', '#ee5262', 'M24 41C17 35 4 26 4 16C4 4 19 2 24 12C29 2 44 4 44 16C44 26 31 35 24 41Z'],
    ['mana', 'SP 魔力', '#40acff', 'M24 3C19 11 7 24 7 31A17 14 0 0 0 41 31C41 24 29 11 24 3Z']
  ]) {
    const group = document.createElement('div'); group.className = 'resource-group';
    group.setAttribute('role', 'img'); parent.append(group);
    const nodes = [];
    for (let i = 0; i < 3; i++) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 48 48'); icon.setAttribute('class', 'resource-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = `<path d="${shape}" fill="${color}" stroke="${kind === 'hp' ? '#aa3547' : '#2473b8'}" stroke-width="2.5"/><ellipse cx="17" cy="17" rx="4" ry="2.5" fill="#fff" opacity=".85" transform="rotate(-35 17 17)"/>`;
      group.append(icon); nodes.push(icon);
    }
    result[kind] = { group, nodes, label };
  }
  return result;
}
export function updateResourceIcons(icons, hp, mana) {
  for (const [kind, value] of [['hp', hp], ['mana', mana]]) {
    const count = Math.max(0, Math.min(3, Math.floor(value || 0)));
    icons[kind].group.setAttribute('aria-label', `${icons[kind].label} ${count}/3`);
    icons[kind].nodes.forEach((node, i) => node.classList.toggle('empty', i >= count));
  }
}
