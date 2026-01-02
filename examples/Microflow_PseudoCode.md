# Microflow: SUB_CalculateOrderTotal

**Module**: OrderManagement
**ReturnType**: Decimal
**Security**: [UserRole: Manager, Admin]

## Parameters
*   `Order` (Entity: OrderManagement.Order)
*   `ApplyDiscount` (Boolean)

## Flow
1.  **Retrieve List** `OrderLines`
    *   **Source**: Association `Order_OrderLines` from parameter `Order`
    *   **XPath**: `[Amount > 0]`

2.  **Create Variable** `TotalAmount`
    *   **Type**: Decimal
    *   **Initial Value**: `0.00`

3.  **Loop** over `OrderLines` (Iterator: `IteratorOrderLine`)
    *   **Change Variable** `TotalAmount`
        *   **Expression**: `$TotalAmount + ($IteratorOrderLine/GraphPrice * $IteratorOrderLine/Quantity)`
    *   *(End Loop)*

4.  **Decision** `Check if Discount Applies`
    *   **Condition**: `$ApplyDiscount = true` and `$TotalAmount > 1000`
    *   **TRUE**:
        *   **Change Variable** `TotalAmount`
            *   **Expression**: `$TotalAmount * 0.90` (10% Discount)
        *   **Log Message** (Info): "Applied bulk discount to Order " + `$Order/OrderNumber`
    *   **FALSE**:
        *   *(Continue)*

5.  **Commit** `Order`
    *   **Member**: `TotalPrice = $TotalAmount`
    *   **Events**: Yes (Refresh in Client)

6.  **End Event**
    *   **Return**: `$TotalAmount`
