
"use client";

import { useState } from "react";
import { 
  Bell, 
  CreditCard, 
  DollarSign, 
  History, 
  PiggyBank, 
  Send, 
  Settings, 
  Shield, 
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Avatar, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Separator 
} from "@/components/ui/separator";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications] = useState([
    { id: 1, type: "security", message: "New login detected from Chrome on Windows", time: "2 min ago" },
    { id: 2, type: "transaction", message: "Transfer to John Doe completed", time: "1 hour ago" },
  ]);

  const [accounts] = useState([
    { id: "12345678", name: "Main Checking", balance: 5842.50, type: "checking" },
    { id: "87654321", name: "Savings Account", balance: 12500.00, type: "savings" },
    { id: "45678901", name: "Credit Card", balance: -1250.75, type: "credit" },
  ]);

  const [transactions] = useState([
    { id: 1, date: "2023-11-15", description: "Grocery Store", amount: -85.32, type: "debit", account: "12345678" },
    { id: 2, date: "2023-11-14", description: "Salary Deposit", amount: 2500.00, type: "credit", account: "12345678" },
    { id: 3, date: "2023-11-12", description: "Online Payment", amount: -120.00, type: "debit", account: "12345678" },
    { id: 4, date: "2023-11-10", description: "Transfer to Savings", amount: -500.00, type: "transfer", account: "12345678" },
    { id: 5, date: "2023-11-08", description: "Restaurant", amount: -45.50, type: "debit", account: "45678901" },
  ]);

  const quickActions = [
    { id: 1, name: "Transfer", icon: Send, color: "text-blue-500" },
    { id: 2, name: "Pay Bills", icon: CreditCard, color: "text-green-500" },
    { id: 3, name: "Deposit", icon: DollarSign, color: "text-purple-500" },
    { id: 4, name: "More", icon: Plus, color: "text-gray-500" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">SimpleBank</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 p-0">2</Badge>
            </Button>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Button key={action.id} variant="outline" className="flex-col h-24">
                    <action.icon className={`h-6 w-6 mb-2 ${action.color}`} />
                    <span>{action.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Protected</p>
                    <p className="text-sm text-muted-foreground">Last login: 2 min ago</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {accounts.map((account) => (
                    <Card key={account.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{account.name}</span>
                          <Badge variant="outline">
                            {account.type === 'credit' ? 'Credit' : account.type === 'savings' ? 'Savings' : 'Checking'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(account.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          •••• •••• {account.id.slice(-4)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="transfers">Transfers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>••••{transaction.account.slice(-4)}</TableCell>
                            <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {transaction.amount > 0 ? (
                                  <ArrowDownLeft className="h-4 w-4" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4" />
                                )}
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(Math.abs(transaction.amount))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View Full History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© {new Date().getFullYear()} SimpleBank. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Button variant="link" size="sm" className="text-muted-foreground">
              Privacy Policy
            </Button>
            <Button variant="link" size="sm" className="text-muted-foreground">
              Terms of Service
            </Button>
            <Button variant="link" size="sm" className="text-muted-foreground">
              Contact Us
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
