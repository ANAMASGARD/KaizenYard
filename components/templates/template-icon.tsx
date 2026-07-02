import type { CSSProperties } from "react";
import {
  Activity,
  BookOpen,
  Calendar,
  CheckSquare,
  DollarSign,
  Flame,
  Heart,
  LayoutTemplate,
  ListTodo,
  PiggyBank,
  Target,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

type TemplateIconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

export function TemplateIcon({ name, className, style }: TemplateIconProps) {
  switch (name) {
    case "Activity":
      return <Activity className={className} style={style} />;
    case "BookOpen":
      return <BookOpen className={className} style={style} />;
    case "Calendar":
      return <Calendar className={className} style={style} />;
    case "CheckSquare":
      return <CheckSquare className={className} style={style} />;
    case "DollarSign":
      return <DollarSign className={className} style={style} />;
    case "Flame":
      return <Flame className={className} style={style} />;
    case "Heart":
      return <Heart className={className} style={style} />;
    case "ListTodo":
      return <ListTodo className={className} style={style} />;
    case "PiggyBank":
      return <PiggyBank className={className} style={style} />;
    case "Target":
      return <Target className={className} style={style} />;
    case "TrendingUp":
      return <TrendingUp className={className} style={style} />;
    case "UtensilsCrossed":
      return <UtensilsCrossed className={className} style={style} />;
    case "LayoutTemplate":
    default:
      return <LayoutTemplate className={className} style={style} />;
  }
}
