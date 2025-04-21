import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserAddressCard from "@/components/common/user-profile/UserAddressCard";
import UserInfoCard from "@/components/common/user-profile/UserInfoCard";
import UserMetaCard from "@/components/common/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Profile() {
  return (
    <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
      <div className="mt-2">
        <div>
            <PageBreadcrumb pageTitle="사용자 설정" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                Profile
                </h3>
                <div className="space-y-6">
                
                <UserInfoCard />
                {/* <UserAddressCard /> */}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}