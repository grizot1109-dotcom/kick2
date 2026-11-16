'use strict';
/* ===== KICK 2: вырезанные лица из пака (tools/match_faces.py) — вместо обычных фото, где они есть ===== */
const _faceOfC=faceOf;
faceOf=function(p){const C=window.KICK_CUT;if(C&&p&&p.photo){const m=/Q\d+/.exec(p.photo);if(m&&C[m[0]])return 'img/cut/'+m[0]+'.webp';}return _faceOfC(p);};
