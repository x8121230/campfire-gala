export const FIREFLY_LANES = Object.freeze([
    Object.freeze({ id: 'red', name: '紅色', key: 'A', color: 0xff625f, softColor: 0xffb3ae, textColor: '#7f2525' }),
    Object.freeze({ id: 'blue', name: '藍色', key: 'S', color: 0x55b8ff, softColor: 0xb7e2ff, textColor: '#14527d' }),
    Object.freeze({ id: 'green', name: '綠色', key: 'D', color: 0x69d67d, softColor: 0xbcefc6, textColor: '#236332' })
]);

const createNotes = () => {
    const notes = [];
    const addPhrase = (beats, lanes, section) => {
        beats.forEach((beat, index) => {
            notes.push({ beat, lane: lanes[index % lanes.length], type: 'normal', section });
        });
    };

    // 第一段：每兩拍一隻，先讓小朋友熟悉三條固定色道。
    addPhrase(
        [4, 6, 8, 10, 12, 14, 16, 18],
        ['red', 'red', 'blue', 'green', 'blue', 'blue', 'green', 'red'],
        'warmup'
    );

    // 第二段：仍維持每兩拍一隻，讓幼兒有完整時間找顏色、移動滑鼠。
    addPhrase(
        [20, 22, 24, 26, 28, 30, 32, 34],
        ['red', 'red', 'green', 'green', 'blue', 'blue', 'red', 'green'],
        'groove'
    );

    // 第三段：取消半拍與突然加速，重複熟悉的雙色節奏完成演奏。
    addPhrase(
        [36, 38, 40, 42, 44, 46],
        ['blue', 'blue', 'red', 'red', 'green', 'green'],
        'finale'
    );

    return notes
        .map((note, index) => Object.freeze({ ...note, id: `firefly_note_${index + 1}` }))
        .sort((left, right) => left.beat - right.beat);
};

export const FIREFLY_RHYTHM_SONG = Object.freeze({
    id: 'firefly_waltz',
    title: '螢火小舞曲',
    composer: '森林益智樂園原創',
    audioKey: 'firefly_rhythm_bgm',
    baseBpm: 80,
    totalBeats: 48,
    introBeats: 4,
    sections: Object.freeze([
        Object.freeze({ id: 'warmup', beat: 0, label: '暖身：跟著大拍點' }),
        Object.freeze({ id: 'groove', beat: 20, label: '合奏：看顏色再按' }),
        Object.freeze({ id: 'finale', beat: 36, label: '星光：一起閃亮' })
    ]),
    notes: Object.freeze(createNotes())
});

export function getNormalFireflyNotes(song = FIREFLY_RHYTHM_SONG) {
    return song.notes.filter((note) => note.type === 'normal');
}

export function getFireflySectionAtBeat(beat, song = FIREFLY_RHYTHM_SONG) {
    return [...song.sections].reverse().find((section) => beat >= section.beat) || song.sections[0];
}
