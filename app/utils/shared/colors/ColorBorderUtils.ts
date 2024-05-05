import { Colors } from "~/application/enums/shared/Colors";

function get300(itemColor: Colors): string {
  switch (itemColor) {
    case Colors.UNDEFINED:
      return "border-gray-300";
    case Colors.SLATE:
      return "border-slate-300";
    case Colors.GRAY:
      return "border-gray-300";
    case Colors.NEUTRAL:
      return "border-neutral-300";
    case Colors.STONE:
      return "border-stone-300";
    case Colors.RED:
      return "border-red-300";
    case Colors.ORANGE:
      return "border-orange-300";
    case Colors.AMBER:
      return "border-amber-300";
    case Colors.YELLOW:
      return "border-yellow-300";
    case Colors.LIME:
      return "border-lime-300";
    case Colors.GREEN:
      return "border-green-300";
    case Colors.EMERALD:
      return "border-emerald-300";
    case Colors.TEAL:
      return "border-teal-300";
    case Colors.CYAN:
      return "border-cyan-300";
    case Colors.SKY:
      return "border-sky-300";
    case Colors.BLUE:
      return "border-blue-300";
    case Colors.INDIGO:
      return "border-indigo-300";
    case Colors.VIOLET:
      return "border-violet-300";
    case Colors.PURPLE:
      return "border-purple-300";
    case Colors.FUCHSIA:
      return "border-fuchsia-300";
    case Colors.PINK:
      return "border-pink-300";
    case Colors.ROSE:
      return "border-rose-300";
  }
}

function get900(itemColor: Colors): string {
  switch (itemColor) {
    case Colors.UNDEFINED:
      return "border-gray-900";
    case Colors.SLATE:
      return "border-slate-900";
    case Colors.GRAY:
      return "border-gray-900";
    case Colors.NEUTRAL:
      return "border-neutral-900";
    case Colors.STONE:
      return "border-stone-900";
    case Colors.RED:
      return "border-red-900";
    case Colors.ORANGE:
      return "border-orange-900";
    case Colors.AMBER:
      return "border-amber-900";
    case Colors.YELLOW:
      return "border-yellow-900";
    case Colors.LIME:
      return "border-lime-900";
    case Colors.GREEN:
      return "border-green-900";
    case Colors.EMERALD:
      return "border-emerald-900";
    case Colors.TEAL:
      return "border-teal-900";
    case Colors.CYAN:
      return "border-cyan-900";
    case Colors.SKY:
      return "border-sky-900";
    case Colors.BLUE:
      return "border-blue-900";
    case Colors.INDIGO:
      return "border-indigo-900";
    case Colors.VIOLET:
      return "border-violet-900";
    case Colors.PURPLE:
      return "border-purple-900";
    case Colors.FUCHSIA:
      return "border-fuchsia-900";
    case Colors.PINK:
      return "border-pink-900";
    case Colors.ROSE:
      return "border-rose-900";
  }
}

export default {
  get300,
  get900,
};
