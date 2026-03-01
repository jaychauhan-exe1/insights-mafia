# Office Manager — How Everything Works

This document explains how the system calculates salaries, tracks attendance, manages leaves, and displays financial summaries. It is written in plain language so anyone can understand it.

---

## Table of Contents

1. [Salary Calculation](#1-salary-calculation)
2. [Daily Attendance Statuses](#2-daily-attendance-statuses)
3. [Half-Day Rule](#3-half-day-rule)
4. [Auto-Marking Absences](#4-auto-marking-absences)
5. [Paid Leave — Monthly Credit](#5-paid-leave--monthly-credit)
6. [Total Payouts on Admin Dashboard](#6-total-payouts-on-admin-dashboard)
7. [Freelancer Earnings](#7-freelancer-earnings)
8. [Dashboard Summary Cards](#8-dashboard-summary-cards)
9. [Office Hours Policy](#9-office-hours-policy)

---

## 1. Salary Calculation

The system calculates each employee's **net monthly salary** automatically based on how many days they were present.

### How it works

Every employee has two numbers set by the admin:

- **Base Salary** — the full monthly pay if they worked every day.
- **Per-Day Deduction** — the amount deducted for each day they were absent.

At the end of each month (or at any point during the month), the system:

1. Looks at every calendar day from the start of the month (or the employee's joining date, whichever is later) up until today.
2. Checks whether the employee was present, absent, on a half-day, or on approved paid leave for each day.
3. Counts the total weighted absences (see table below).
4. Multiplies those absences by the per-day deduction.
5. Subtracts that total deduction from the base salary.

### Absence Weights

| Day Type                      | Counts As    |
| ----------------------------- | ------------ |
| Present (full day)            | 0 absences   |
| Approved Paid Leave           | 0 absences   |
| Half Day (worked < 4 hours)   | 0.5 absences |
| Absent (did not show up)      | 1.0 absence  |
| Unpaid Leave / Day Off        | 1.0 absence  |
| No record at all for that day | 1.0 absence  |

### Formula

> **Net Salary = Base Salary − (Total Absences × Per-Day Deduction)**

The salary will **never go below ₹0**, even if deductions exceed the base salary.

### New Joiners

If an employee joined mid-month, the system only counts days from their **first check-in date** onwards — they are not penalised for days before they joined.

---

## 2. Daily Attendance Statuses

Each working day for an employee gets one of the following statuses:

| Status       | Meaning                      | Effect on Salary                          |
| ------------ | ---------------------------- | ----------------------------------------- |
| **Present**  | Worked a full day (4+ hours) | No deduction                              |
| **Half Day** | Worked less than 4 hours     | Half the normal deduction                 |
| **Absent**   | Did not check in at all      | Full day deduction                        |
| **Paid Off** | Used an approved paid leave  | No deduction (leave balance reduced by 1) |
| **Off**      | Taken an unpaid day off      | Full day deduction                        |

---

## 3. Half-Day Rule

When an employee checks out, the system automatically calculates **how many hours they worked** that day.

- If the total time worked is **less than 4 hours** → the day is marked as a **Half Day**.
- If the total time worked is **4 hours or more** → the day is marked as **Present**.

This happens automatically upon check-out — no manual input is needed.

---

## 4. Auto-Marking Absences

To ensure attendance records are always complete, the system runs an automatic check at the end of each working day (after 6:00 PM IST):

- Any employee who **did not check in** at all that day is automatically recorded as **Absent**.
- Any employee who **checked in but forgot to check out** is automatically checked out at 6:00 PM, and their total hours are calculated accordingly (may result in a Half Day or Present depending on duration).

This prevents gaps in attendance records and ensures the salary calculation always has accurate data.

---

## 5. Paid Leave — Monthly Credit

Every employee automatically receives **1 paid leave** at the start of each calendar month.

- This is added to their leave balance on the 1st of every month.
- The system keeps track of when the last leave was credited so it is never added more than once per month.
- When a leave request is approved as a **paid leave**, the employee's leave balance is reduced by 1, and that day does not affect their salary.
- If an employee has no paid leaves remaining, the leave can still be approved but it will be treated as an **unpaid day off** (i.e., the normal per-day deduction applies).

---

## 6. Total Payouts on Admin Dashboard

The **Total Payouts** figure on the admin dashboard shows the total amount the company owes across all employees and freelancers for the current month.

It is calculated as:

> **Total Payouts = Sum of all Employee Net Salaries + Sum of all Freelancer Wallet Balances**

- **Employee salaries** are individually calculated as described in §1 above, for each employee, and then added together.
- **Freelancer wallet balances** are the accumulated earnings from completed tasks that have not yet been withdrawn.

---

## 7. Freelancer Earnings

Freelancers are paid per task, not per month.

- When a freelancer's task is marked as completed and approved by the admin, the agreed payment amount is added to their **wallet balance**.
- The wallet balance accumulates over time.
- Admins can see each freelancer's current wallet balance on the Finances page.
- The freelancer can also see their own wallet balance and transaction history on their Wallet page.

---

## 8. Dashboard Summary Cards

Each user sees personalised summary cards when they log in.

### Admin View

| Card                   | What it shows                                          |
| ---------------------- | ------------------------------------------------------ |
| **Total Team**         | Total number of people registered in the system        |
| **Total Active Tasks** | Tasks that are not yet completed                       |
| **Total Payouts**      | This month's total salary + freelancer wallet balances |

### Employee View

| Card            | What it shows                                |
| --------------- | -------------------------------------------- |
| **My Tasks**    | Total tasks assigned to this employee        |
| **Days Worked** | Number of days attended in the current month |
| **Finished**    | Completed tasks                              |

### Freelancer View

| Card         | What it shows                           |
| ------------ | --------------------------------------- |
| **My Tasks** | Total tasks assigned to this freelancer |
| **Finished** | Completed tasks                         |
| **Earnings** | Current wallet balance                  |

---

## 9. Office Hours Policy

Employees can only check in and check out **within the following hours (India Standard Time)**:

> **Check-in / Check-out window: 10:00 AM – 6:00 PM IST**

- Attempting to check in before 10:00 AM will show an error.
- Attempting to check in or check out after 6:00 PM will show an error.
- All times displayed in the app are in **Indian Standard Time (IST)** regardless of where the user is physically located.
