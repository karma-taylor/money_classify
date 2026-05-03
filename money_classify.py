"""
薪酬纸币计算器：从大面额向下贪心分配（50000 → 25000 → 10000 → 5000）。
"""

from __future__ import annotations

# 面值由大到小，贪心顺序
DENOMINATIONS_DESC = (50_000, 25_000, 10_000, 5_000)
STEP = 5_000  # 所有面值的最大公约数


def classify(amount: int) -> tuple[list[tuple[int, int]], int]:
    """
    将金额分解为各面额张数。

    返回 ( [(面值, 张数), ...] 仅包含张数>0的面额 , 无法用纸币凑出的零头 )。
    若 amount < 0，抛出 ValueError。
    """
    if amount < 0:
        raise ValueError("金额不能为负数")
    if amount == 0:
        return [], 0

    remainder = amount
    result: list[tuple[int, int]] = []

    for denom in DENOMINATIONS_DESC:
        if remainder >= denom:
            count, remainder = divmod(remainder, denom)
            if count:
                result.append((denom, count))

    # 余数无法再用给定纸币凑整（非 5000 倍数时会有剩余）
    return result, remainder


def format_breakdown(amount: int) -> str:
    """人类可读字符串。"""
    parts, leftover = classify(amount)
    lines = [f"总金额: {amount:,}"]
    if parts:
        lines.append("分配:")
        for denom, cnt in parts:
            lines.append(f"  {denom:,} × {cnt} = {denom * cnt:,}")
        subtotal = sum(d * c for d, c in parts)
        lines.append(f"  小计: {subtotal:,}")
    if leftover:
        lines.append(f"余数（无法用给定纸币凑满）: {leftover:,}")
    elif amount > 0 and not parts:
        lines.append("无法用给定纸币表示（请检查金额）。")
    return "\n".join(lines)


def main() -> None:
    import argparse
    import sys

    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="薪酬纸币贪心计算器")
    parser.add_argument(
        "amount",
        type=int,
        nargs="?",
        help="金额（整数，与纸币面值同单位）",
    )
    parser.add_argument(
        "-i",
        "--interactive",
        action="store_true",
        help="交互模式：循环输入金额",
    )
    args = parser.parse_args()

    def run_one(amt: int) -> None:
        if amt % STEP != 0:
            print(f"提示: 当前面值最小单位为 {STEP:,}，非整数倍时将留下余数。\n")
        print(format_breakdown(amt))
        print()

    if args.interactive or args.amount is None:
        print("薪酬纸币计算器（面值 5000 / 10000 / 25000 / 50000），输入 q 退出。\n")
        while True:
            try:
                s = input("请输入金额: ").strip()
            except EOFError:
                break
            if not s or s.lower() == "q":
                break
            try:
                run_one(int(s))
            except ValueError as e:
                print(f"输入无效: {e}\n")
    else:
        run_one(args.amount)


if __name__ == "__main__":
    main()
