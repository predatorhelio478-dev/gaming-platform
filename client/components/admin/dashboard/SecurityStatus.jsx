export default function SecurityStatus({ connected, admin }) {
    return (
        <section className="rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-slate-600">System</p>
            <h3 className="mt-1 text-lg font-bold">Security Status</h3>

            <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <span className="text-sm text-slate-500">Admin Auth</span>
                    <span className="text-xs font-bold text-green-400">ACTIVE</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <span className="text-sm text-slate-500">Socket</span>
                    <span className={connected ? "text-xs font-bold text-green-400" : "text-xs font-bold text-red-400"}>
                        {connected ? "CONNECTED" : "OFFLINE"}
                    </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <span className="text-sm text-slate-500">Role</span>
                    <span className="text-xs font-bold uppercase text-purple-400">
                        {admin?.role || "-"}
                    </span>
                </div>
            </div>
        </section>
    );
}
