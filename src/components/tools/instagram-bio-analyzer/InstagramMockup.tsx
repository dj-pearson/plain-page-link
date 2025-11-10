/**
 * Instagram Profile Mockup
 * Shows a realistic preview of how the bio looks on Instagram
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Grid, User } from 'lucide-react';

interface InstagramMockupProps {
  username?: string;
  bio: string;
  profilePicture?: string;
  fullName?: string;
  location?: string;
  followerCount?: string;
  followingCount?: string;
  postCount?: string;
}

export function InstagramMockup({
  username = 'your.username',
  bio,
  profilePicture,
  fullName = 'Your Name',
  location = 'Your Location',
  followerCount = '1,234',
  followingCount = '567',
  postCount = '89',
}: InstagramMockupProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Instagram Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" fill="currentColor"/>
            <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
          </svg>
          <span className="font-semibold">{username}</span>
        </div>
        <MoreVertical className="w-6 h-6" />
      </div>

      {/* Profile Info */}
      <div className="p-4">
        {/* Profile Picture and Stats */}
        <div className="flex items-center gap-6 mb-4">
          {/* Profile Picture */}
          <div className="relative">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            {/* Story Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-500 -m-1" />
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="font-bold text-lg">{postCount}</div>
              <div className="text-gray-600 text-xs">posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{followerCount}</div>
              <div className="text-gray-600 text-xs">followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{followingCount}</div>
              <div className="text-gray-600 text-xs">following</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="space-y-1 mb-4">
          <div className="font-semibold">{fullName}</div>
          <div className="text-gray-600 text-sm">{location}</div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {bio}
          </div>
          <a href="#" className="text-blue-600 text-sm font-semibold">
            agentbio.net/{username}
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-500 text-white font-semibold py-1.5 rounded-lg text-sm">
            Follow
          </button>
          <button className="flex-1 bg-gray-200 font-semibold py-1.5 rounded-lg text-sm">
            Message
          </button>
          <button className="bg-gray-200 px-3 py-1.5 rounded-lg">
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* Story Highlights */}
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {['Listings', 'Sold', 'Tips', 'About'].map((highlight) => (
            <div key={highlight} className="flex flex-col items-center gap-1 min-w-[64px]">
              <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300" />
              <span className="text-xs text-gray-600">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-t border-gray-200 flex">
        <button className="flex-1 py-3 border-t-2 border-black">
          <Grid className="w-6 h-6 mx-auto" />
        </button>
        <button className="flex-1 py-3 text-gray-400">
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
          </svg>
        </button>
        <button className="flex-1 py-3 text-gray-400">
          <User className="w-6 h-6 mx-auto" />
        </button>
      </div>

      {/* Grid Preview */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-gray-300" />
        ))}
      </div>
    </div>
  );
}

/**
 * Before/After Instagram Comparison
 */
export function InstagramComparison({
  beforeBio,
  afterBio,
  username,
  fullName,
  location,
}: {
  beforeBio: string;
  afterBio: string;
  username?: string;
  fullName?: string;
  location?: string;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-center">See the Difference</h3>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Before */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <h4 className="font-bold text-lg">Before Optimization</h4>
          </div>
          <div className="transform scale-90 origin-top">
            <InstagramMockup
              username={username}
              bio={beforeBio}
              fullName={fullName}
              location={location}
            />
          </div>
        </div>

        {/* After */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <h4 className="font-bold text-lg">After Optimization</h4>
          </div>
          <div className="transform scale-90 origin-top">
            <InstagramMockup
              username={username}
              bio={afterBio}
              fullName={fullName}
              location={location}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
