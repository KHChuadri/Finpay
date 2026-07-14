interface SendMoneyCardProps {
	transferCompleted: boolean;
	onTransfer: () => void;
}

const SendMoneyCard = ({ transferCompleted, onTransfer }: SendMoneyCardProps) => {
	return (
		<div className="mb-2">
			<label className="block text-sm font-medium text-foreground mb-2">You are sending:</label>
			<div className="bg-muted p-4 rounded-xl mb-4">
				<p className="text-2xl font-bold">$41,212.40 AUD</p>
				<p className="text-sm text-foreground mt-2">Current Balance: $3,141,413.08</p>
			</div>

			<label className="block text-sm font-medium text-foreground mb-2">Recipient Receive:</label>
			<div className="bg-muted p-4 rounded-xl mb-4">
				<p className="text-2xl font-bold">Rp427,827,160.77 IDR</p>
				<p className="text-sm text-foreground mt-2">1 AUD = 10,381.03 IDR</p>
			</div>

			<label className="block text-sm font-medium text-foreground mb-2">Requesting to:</label>
			<div className="flex flex-col bg-muted rounded-xl mb-4 p-4">
				{/* Account Type */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-2">Account Type:</label>
					<div className="flex justify-between mb-4 items-center border-2 border-primary rounded-xl p-3 bg-card">
						<div className="flex items-center gap-2">
							<p className="text-xl">🌐</p>
							<p className="font-semibold text-sm text-foreground">FinPay</p>
						</div>

						<button className="flex items-center gap-1 text-foreground font-medium">
							Change
							<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
					</div>
				</div>

				{/* FinPay Account */}
				<div className="mb-2">
					<label className="block text-sm font-medium text-foreground mb-2">FinPay Account:</label>
					<div className="flex justify-between items-center border-2 border-primary rounded-xl p-3 bg-card">
						<div className="flex items-center gap-2">
							<p className="text-xl">👨‍💼</p>
							<p className="font-semibold text-sm text-foreground">John Doe</p>
						</div>

						<button className="flex items-center gap-1 text-foreground font-medium">
							Change
							<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Transaction Summary */}
			<label className="block text-sm font-medium text-foreground mb-2">Transaction Summary:</label>
			<div className="flex flex-col bg-muted rounded-xl mb-2 p-4">
				{/* Transaction Text */}
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<p className="text-foreground">Account Type</p>
						<p className="font-medium">FinPay</p>
					</div>
					<div className="flex justify-between">
						<p className="text-foreground">Account ID</p>
						<p className="font-medium">1234567890</p>
					</div>
					<div className="flex justify-between">
						<p className="text-foreground">Account Name</p>
						<p className="font-medium">John Doe</p>
					</div>
					<div className="flex justify-between">
						<p className="text-foreground">Payment Currency</p>
						<p className="font-medium">Australian Dollars (AUD)</p>
					</div>
					<div className="flex justify-between">
						<p className="text-foreground">Payment Amount</p>
						<p className="font-medium">$41,212.00</p>
					</div>
					<div className="flex justify-between">
						<p className="text-foreground">PayFin Fee</p>
						<p className="font-medium">$4.12</p>
					</div>
					<div className="flex justify-between pt-2 border-t border-border">
						<p className="text-foreground font-semibold">Total Fee</p>
						<p className="text-foreground font-bold">$41,216.12</p>
					</div>
				</div>
			</div>

			{/* Transfer Button */}
			{!transferCompleted ? (
				<button
					onClick={onTransfer}
					className="w-full mt-4 py-3 text-primary-foreground rounded-xl bg-primary hover:opacity-90 transition"
				>
					Send Money
				</button>
			) : (
				<div className="w-full mt-4 py-3 text-center text-positive font-semibold bg-positive/10 rounded-xl">
					Transfer Successful!
				</div>
			)}
		</div>
	);
}

export default SendMoneyCard;