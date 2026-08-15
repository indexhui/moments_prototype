# FMOD Bank game integration

The web game loads `Master.bank` and `Master.strings.bank` lazily through
`src/lib/game/fmodWeb.ts`.

The main theme uses a separate persistent FMOD instance. Its volume defaults to
65%, can be adjusted from the in-game or lobby settings panel, and is stored in
the browser under `moment:fmod-music-volume`.

## Connected events

| FMOD event | Game use |
| --- | --- |
| `event:/music/music_piece_main` | Persistent background music throughout `/game` |
| `event:/ui/ui_start_game` | Start game button |
| `event:/ui/ui_dialogue_click` | Dialogue button, keyboard, and full-screen continue actions |
| `event:/ui/ui_choice_confirm` | Main story and route-event choices |
| `event:/ui/ui_map_road_on` | Valid route connection / departure |
| `event:/object/obj_take_photo` | Shared photo shutter |
| `event:/object/obj_take_photo_done` | Keep / confirm captured photo |
| `event:/object/obj_clock_alarm` | Visual-novel alarm scene |
| `event:/object/obj_char_fall` | Main-story and exhibition fall sequence |
| `event:/object/obj_room_door_open` | Door swipe and entrance transition |
| `event:/object/obj_room_door_close` | Entrance transition close |

`drop_001.ogg` remains assigned to moving or placing location tiles. The FMOD
route event only plays after a valid route connects or departs.

## Intentionally deferred

The office ambience and opening-menu music are not started globally yet. The
main theme has its own long-running FMOD instance, so UI and object one-shots do
not interrupt it. Door knock, dice drop, and scattered paper remain available
for a later scene-specific pass.
