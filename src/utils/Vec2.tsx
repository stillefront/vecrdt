export class Vec2 {
  __x: number;
  __y: number;

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static new(x: number = 0, y: number = 0): Vec2 {
    return new Vec2(x, y);
  }

  constructor(x: number = 0, y: number = 0) {
    this.__x = x;
    this.__y = y;
  }

  x(): number {
    return this.__x;
  }

  y(): number {
    return this.__y;
  }

  add(other: Vec2 | AutomergeVec2): Vec2 {
    return new Vec2(this.__x + other.__x, this.__y + other.__y);
  }

  sub(other: Vec2 | AutomergeVec2): Vec2 {
    return new Vec2(this.__x - other.__x, this.__y - other.__y);
  }

  copy(): Vec2 {
    return Vec2.new(this.__x, this.__y);
  }

  // automerge convert
  static from(obj: AutomergeVec2): Vec2 {
    return new Vec2(obj.__x, obj.__y);
  }

  toObject(): AutomergeVec2 {
    return { __x: this.__x, __y: this.__y };
  }
}

export type AutomergeVec2 = { __x: number; __y: number };
